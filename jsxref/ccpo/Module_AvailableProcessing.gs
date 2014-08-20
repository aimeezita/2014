function updateAvailableFields_cron() 
{
  var computation=new CCPOAvailableProcessingClass();
  computation.updateAvailableFields();
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOAvailableProcessingClass()
{
  var errorList=new CCPOErrorListClass();
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");
  var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");
  var availSheet =  getBenchSpreadsheet().getSheetByName("Available");
  var availRows = getRows(availSheet);
  var headers=getSheetHeaders(availSheet);

  
  /////////////////////////////////////////////////////////////////
  this.updateAvailableFields=function ()
  {
    var headersIdx=getHeaderIndexes(availSheet);
    var globerSkills=new CCPOGloberSkillsClass();

    errorList.clear();
    var skillComputations=0; //it takes a lot of time to compute, we only do some of them every run
    var today=new Date().getTime();
    //Columns to compute
    var columnsToCompute=["Fecha CV actualizado","SeniorityRange","Copia Nombre","English","Studio","globerId","canTravel","Knowledge", "Location"];//,"Aging"];
    for(var i=0;i<availRows.length;i++)
    {
      var row=availRows[i];
      
      try{
      row.Aging = Math.floor((today-row["Bench Start Date"].getTime())/1000/3600/24);
      }catch(e) {} /* ignore date errors */
      
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
        row["SeniorityRange"]="NOTFOUND"; 
      
      row["Copia Nombre"]=row["Name"];    
      if ("NH"==row.Email)
        continue;
      
      
      var glober=globerMap[row.Email];
     
      if (glober)
      {
        row["Fecha CV actualizado"]=glober["Upload CV"];    
        row["English"]=glober["English level"];
        row["Studio"]=glober["Glober Studio"];    
        row["globerId"]=glober["Glober ID"];    
        row["canTravel"]=glober["Max Time Abroad"];
        
        var location=glober["Glober Office"].split("/");
        if (location[0])
        {
          if (location[1])
            row["Location"]=location[0]+"/"+location[1];    
          else
            row["Location"]=location[0];    
        }

        row["Knowledge"]="NOTCOMPUTED";
/* encontrar una manera de que no ocupe mucho espacio en la ui 
        if (skillComputations<150 && isEmptyString(row["Knowledge"]))
        {
          skillComputations++;           
          Logger.log(""+skillComputations+") Computing Skills:"+row.Email);
          var theSkills=globerSkills.getGloberSkillsByEmail(row.Email,4);
          theSkills.sort(function(a,b){return b.knowledge-a.knowledge;});
          
          row["Knowledge"]="";

          var maxValues=10;
          for(var j=0;j<theSkills.length && maxValues>0;j++)
          {
            if (theSkills[j].skillPath.indexOf("Behavioral")>=0) 
              continue;
            if (theSkills[j].skillPath.indexOf("/General Shared Skills /Languages/Spanish")>=0) 
              continue;
            if (theSkills[j].skillPath.indexOf("/General Shared Skills /Languages/English")>=0) 
              continue;
            if (theSkills[j].skillPath.indexOf("/PM/")>=0) 
              continue;
            
            if (theSkills[j].skillPath.indexOf("Globant")==0) //if starts with "Globant"
            {
              row["Knowledge"]+=theSkills[j].skillName+","+theSkills[j].knowledge+"\r\n";
              maxValues--;
            }
          }
          if (isEmptyString(row["Knowledge"]))
            row["Knowledge"]="NOTFOUND";

        }
        */
      }
      else
        Logger.log("Email not found: "+row.Email);
    }    
    
    for(var j=0;j<columnsToCompute.length;j++)
    {
      var columnNumber=headersIdx[columnsToCompute[j]];
      
      var values=new Array(availRows.length);
      for(var i=0;i<availRows.length;i++)
      {
        values[i]=new Array(1);
        values[i][0]=availRows[i][columnsToCompute[j]];
      }
      availSheet.getRange(2,columnNumber,values.length,1).setValues(values);
      
    }
    
  }    

}
