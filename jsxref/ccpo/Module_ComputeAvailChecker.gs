

function computeAvailChecker_cron() 
{
//  var startingDate=addDaysToDate(1,new Date());
    var startingDate=new Date();
  
//Phase 1: Compute list of globers without assignment

  Logger.log("Start: compute globers with no assignment");
  var computation=new CCPOComputeAvailCheckerClass();
  var results=computation.compute(startingDate);
  var sheet =getAvailCheckerSheet();
  computation.saveResults(sheet,startingDate,results)
  Logger.log("End: compute globers with no assignment");


//Phase 2: Sync values to spreadshett used by everybody without loosing their changes and special columns
  
  Logger.log("Start: sync available sheet");
  var computation=new CCPOComputeAvailablesClass();  
//  computation.setUpdateAvailableSheet(false);
  computation.run();
//  computation.informErrors("dario.robak@globant.com, francisco.rodriguez@globant.com,analia.altieri@globant.com");
  computation.informErrors("dario.robak@globant.com");

  Logger.log("End: sync available sheet");
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeAvailCheckerClass ()
{
  var errorList=new CCPOErrorListClass();
  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  
  /************************************************************/
  this.compute=function (dateToUse)
  {
    var date=normalizeDate(dateToUse);
    
    var releasesSheet =getGlowImport2Spreadsheet().getSheetByName("ReleasesActualAndFuture");
    var releaseRows = getRows(releasesSheet);
    
    releaseRows.sort(releasesSortFunction);
    
    var lastGloberId="";
    var results=[];
    
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      var globerId=row["Glober ID"];
      
      if (globerId==lastGloberId)
        continue;
      
      //ignore rows ending before 'date' 
      if (row["End Date"]!='null' && (normalizeDate(row["End Date"])<date))
        continue;
      
      var globerReleaseRows=[];
      for(var j=i;j<releaseRows.length;j++)
      {
        var row2=releaseRows[j];
      
        if (globerId!=row2["Glober ID"])
          break; //found another glober, get out of here

        //ignore rows ending before 'date' 
        if (row2["End Date"]!='null' && (normalizeDate(row2["End Date"])<date))
        continue;

        //Fix dates
        row2["Starting Date"]=CCPODateUtils.makeWorkingDay(row2["Starting Date"]);
        if (row2["End Date"]=='null')
          row2["End Date"]=null;
        

        globerReleaseRows.push(row2);
        
      }
      handleGlober(date,results,globerId,globerReleaseRows);
      lastGloberId=globerId;
    }
    results.sort(resultsSortFunction);
    
    return results;
  }
        
  /************************************************************/
  function releasesSortFunction(a,b)
  {
    if (a["Glober ID"]<b["Glober ID"])
      return -1;
    if (a["Glober ID"]>b["Glober ID"])
      return 1;
    
    if (a["End Date"]<b["End Date"])
      return -1;
    if (a["End Date"]>b["End Date"])
      return 1;
    
    return (a.Percentage-b.Percentage);
  }

  /************************************************************/
  function handleGlober(date,results,globerId,releaseRows) 
  {
    var glober=getGlober(globerId);
    if (!glober)
    {
      Logger.log("Cannot find glober: "+globerId+" "+releaseRows[0]["E-Mail"]);
    return;
    }
      //Logger.log("namdle "+glober.Email+","+releaseRows.length);
    
    //START: compute amount in bech now 
    var percentInBench=0;
    var startDateInBench;
    var availability;
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      var projectTag=row["Project TAG"];
      if (isGlobantBench(projectTag)) //Bench
      {
        var startDate=normalizeDate(row["Starting Date"]);
        //Logger.log(startDate+","+date);
        if (startDate<=date)
        {
          percentInBench+=row["Percentage"];
          availability=row["Availability"];
          if (!startDateInBench || startDate<normalizeDate(startDateInBench))
            startDateInBench=row["Starting Date"];
        }
      }
    }

    if (percentInBench>0)
      results.push({globerId:globerId,glober:glober,
                    projectTag:"N/A",availDate:startDateInBench,percentage:percentInBench,percentageBench:0,availability:availability});
      
    //END: compute amount in bech now 

    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
          
      var projectTag=row["Project TAG"];      
      
      if (isGlobantBench(projectTag)) //Bench
      {
        continue; //ignore non-assigned
      }
      
      if (!row["End Date"])
        continue; //ignore never ending assignments
      
      var endDate=normalizeDate(row["End Date"]);
      var percentage=row["Percentage"];
      var availability=row["Availability"];
    //Logger.log("namdle "+endDate+","+percentage);
      
      //Handle all releases at the same day. Remember that they are sorted in end date ascending order
      for(var j=i+1;j<releaseRows.length;j++,i++)
      {
        var rowToCompare=releaseRows[j];
        if (!rowToCompare["End Date"])
          break;
        if(endDate!=normalizeDate(rowToCompare["End Date"]))
          break;
        
        if (isGlobantBench(rowToCompare["Project TAG"])) //Bench
          continue; //ignore non-assigned

        percentage+=rowToCompare["Percentage"];
        
      }

      var nextDate=CCPODateUtils.makeWorkingDay(addDaysToDate(1,row["End Date"]));
      var nextDateNormalized=normalizeDate(nextDate) ;
            
      //Handle all releases starting the next day
      var percentageBench=0;
      for(var j=i+1;j<releaseRows.length;j++)
      {
        var rowToCompare=releaseRows[j];
        if (nextDateNormalized!=normalizeDate(rowToCompare["Starting Date"]))
          continue;
        
        if (isGlobantBench(rowToCompare["Project TAG"])) //Bench
          percentageBench+=rowToCompare["Percentage"];
        else
          percentage-=rowToCompare["Percentage"];
        
      }
      var release={globerId:globerId,glober:glober,
                   projectTag:projectTag,availDate:nextDate,percentage:percentage,percentageBench:percentageBench,availability:availability};

        
      if (percentageBench<percentage )
        Logger.log("Error in bench assignment:"+glober.Email+","+projectTag+","+endDate+","+percentage+","+percentageBench);
        
      if (percentage>0)
        results.push(release);
    }

  }

  /************************************************************/
  this.saveResults=function (sheet,dateUsed,results)
  {
    var dateComputed=normalizeDate(dateUsed);
    var maxDate=normalizeDate(addDaysToDate(21,dateUsed));
    
    var values=[];
    var headers=["DateComputed","globerId", "Email","role", "seniority"
                 ,"availDate", "percentage","entryDate","location","english","uploadCV","studio","staff","projectTag","client","project","Comment","availability"];

    
    values.push(headers);    
    for(var i=0;i<results.length;i++)
    {
      row=[dateComputed];      
      d=results[i];
      
      if (normalizeDate(d.availDate)>maxDate)
        continue;

      var project;
      if(d.projectTag!="N/A")
        project=getProject(d.projectTag);
      else
        project={Client:"N/A", Project:"N/A"}
        
      d.entryDate=d.glober["Entry Date"];	
      d.location=d.glober["Glober Office"];	
      d.english=d.glober["English level"];
      d.uploadCV=d.glober["Upload CV"];
      d.studio=d.glober["Glober Studio"];	
      d.staff=d.glober["Staff"];
      d.Email=d.glober.Email;
      d.role=d.glober.Role;
      d.seniority=d.glober.Seniority;
      d.Comment=""
      d.client=project.Client;
      d.project=project.Project;
      if (!d.availDate) d.availDate="NOW!";
      
      for(var j=1;j<headers.length;j++)
        row.push(d[headers[j]]);
      
      values.push(row);
    }
    saveSheetValues(values,sheet,1000);
  }

        
  /************************************************************/
  function resultsSortFunction(a,b)
  {
    if (a["availDate"]<b["availDate"])
      return -1;
    if (a["availDate"]>b["availDate"])
      return 1;
    
    if (a["globerId"]<b["globerId"])
      return -1;
    if (a["globerId"]>b["globerId"])
      return 1;
    
    return a.percentage-b.percentage;
  }

  
  /************************************************************/
  function getProject(projectTag)
  {
    assert(projectTag in projectMap,"Cannot find project:"+projectTag);
    return projectMap[projectTag];
  }

  /************************************************************/
  function getGlober(globerId)
  {
    //assert(globerId in globerMap,"Cannot find glober:"+globerId);
    return globerMap[globerId];
  }


}
  

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeAvailablesClass()
{
  var HEADER_EMAIL="Email";
  var errorList=new CCPOErrorListClass();
  var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");

  var origSheet = getAvailCheckerSheet();
  //var destSheet = getTestingAvailableSheet();
  var destSheet = getBenchSpreadsheet().getSheetByName("New Available");
  
  var ignoreListSheet = getGlowImportSpreadsheet().getSheetByName("EmailIgnoreList");
  var updateAvailableSheet=true;
  
  //Headers
  //Name	Email	%	Location	Skill	Seniority	Studio	English	Bench Start Date	Aging	Source	Assignment	Handler Team	Plan	Start Date	Assignment Plan Ticket #	Copia Nombre	Assignment Plan Description	Assignment Plan Client	Stage	SeniorityRange	Weak	Weak: Description	Weak: MailSent	Weak: Start date	TicketEntrevista	Fecha CV actualizado	PlanAgainsTargetDate	Vacaciones	Staffing Suggestions
  
  this.setUpdateAvailableSheet=function(value)
  {
    updateAvailableSheet=value;
  }
  
  /************************************************************/
  this.run=function ()
  {
    var currentTime=new Date().getTime();
    var lastRow=destSheet.getLastRow();
    
    var computedAvailGlobers=getRows(origSheet);    
    var destValues=getRows(destSheet); 
    var ignoreListValues=getRows(ignoreListSheet);
    //Logger.log(ignoreListValues);
    
    var computedAvailglobersIdx=getHeaderIndexes(origSheet)  
    var destIdx=getHeaderIndexes(destSheet)  
    
    Logger.log("Phase 1");
    
    var percentValues=new Array(destValues.length);
    var startDateValues=new Array(destValues.length);
    
    
    //for each row in destination, see if the row appears in origen
    for(var i=0;i<destValues.length;i++)
    {
      var destObj=destValues[i];
      var destEmail=destObj[HEADER_EMAIL];      
      
      percentValues[i]=new Array(1);
      startDateValues[i]=new Array(1);
      percentValues[i][0]=destObj["%"];
      startDateValues[i][0]=destObj["Bench Start Date"];
      
      if (destEmail=="" || destEmail=="NH")
        continue;
      
      
      var positionFound=lookForValueInRows(destEmail,computedAvailGlobers,"Email");
      if(positionFound>=0)
      {
        percentValues[i][0]=computedAvailGlobers[positionFound]["percentage"];
        startDateValues[i][0]=computedAvailGlobers[positionFound]["availDate"];
        computedAvailGlobers[positionFound].alreadyHandled=1;
        computedAvailGlobers[positionFound]["Email"]="ALREADYHANDLED"; //To avoid matching it again
        
      }
      else
      {
        percentValues[i][0]="NOT LONGER FREE";
        startDateValues[i][0]="NOT LONGER FREE";
      }
      
    }
    
    if (updateAvailableSheet)
    {
      destSheet.getRange(2,destIdx["%"],percentValues.length,1).setValues(percentValues);
      destSheet.getRange(2,destIdx["Bench Start Date"],startDateValues.length,1).setValues(startDateValues);
    
      //Remove rows NOT LONGER FREE
      for(var i=destValues.length-1;i>=0;i--)
      {
        if (percentValues[i][0]=="NOT LONGER FREE")
        {
          Logger.log("Deleting row: "+i+" "+destValues[i][HEADER_EMAIL]);
          destSheet.deleteRow(i+2);  //i+2 to take into account headers plus rows starting at 1 instead of 0. 
        }
      }
    }
    Logger.log("Phase 2");
    
    //Add new rows and update existing ones 
    //For each row in origen look for it in dest. If found update fields, if not found create new and update fields
    var rowsToAdd=new Array();
    for(var i=0;i<computedAvailGlobers.length;i++)
    {
      var origObj=computedAvailGlobers[i];
      var origEmail=origObj[HEADER_EMAIL];
      
      //var positionFound=lookForValueInRows(origEmail,destValues,"Email");
      if (computedAvailGlobers[i].alreadyHandled)
        continue;
      
      
      
      var positionFound=lookForValueInRows(origEmail,ignoreListValues,"Email");
      if ( positionFound >=0)
        continue;        

      rowsToAdd.push(origObj);
      //check new people in less than 12 days, but no newhires (3 days allowance)
      var oneHourMillis=1000*60*60.0;

      if (origObj.availDate.getTime()-currentTime<12/*days*/ * 24/* hours/day */ * oneHourMillis)
      if (origObj.entryDate.getTime()  -currentTime> 3/*days*/ * 24/* hours/day */ * oneHourMillis)
      {
        //Check to see if its only a change in startdate. only report cases that appear out of the blue
        positionFound=lookForValueInRows(origEmail,destValues,"Email");
        if ( positionFound <0)
          errorList.addError("Available in less than 14 days:"+origEmail+", percent:"+origObj.percentage+", availdate:"+normalizeDate(origObj.availDate)+", entryDate:"+normalizeDate(origObj.entryDate),"NEWAVAIL");
      }
    }
    
    Logger.log("Adding "+rowsToAdd.length+" globers");
    var values=[];
    var today=new Date();
    for(var i=0;i<rowsToAdd.length;i++)
    {
      
  //Name	Email	%	Location	Skill	Seniority	Studio	English	Bench Start Date	Aging	Source	Assignment	Handler Team	Plan	Availability Start Date	Assignment Plan Ticket #	Copia Nombre	Assignment Plan Description	Assignment Plan Client	Stage	SeniorityRange	Weak	Weak: Description	Weak: MailSent	Weak: Start date	TicketEntrevista	Fecha CV actualizado	PlanAgainsTargetDate	Vacaciones	Staffing Suggestions
//DateComputed	globerId	Email	role	seniority	availDate	percentage	entryDate	location	english	uploadCV	studio	staff	projectTag	client	project	Comment			
      var row=rowsToAdd[i];
      
      var seniorityRange=seniorityRangeMap[row.seniority];
      if (seniorityRange)
        row.seniorityRange=seniorityRange.SeniorityRange;
      else
        row.seniorityRange="NOTFOUND"; 
      
      
      values.push([
      row.globerId,row.Email, row.percentage, row.location,row.role,row.seniority,row.studio,row.english,row.availDate,null,null,row.seniorityRange,row.client+"/"+row.project,today,"","noplan",row.availability
      ]);
    }
    saveSheetValues(values,destSheet,1000,true);


  }
  
  this.informErrors=function(emailAddress)
  {
    errorList.sendEmailWithErrors(emailAddress,"AvailChecker Process");
  }

}
  /***************************************/
  
