

function computeDispersion_cron() 
{
  var computation=new CCPOComputeDispersionClass();
  var dateToUse=new Date();
  var results=computation.compute(dateToUse);
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeDispersionClass ()
{
  var errorList     = new CCPOErrorListClass();
  var projectMap    = computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap     = computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var assignments   = new CCPOAssignmentClass();
  var dateToUse     = new Date();
  var currentAssignments   = assignments.getAllAssignmentsForDate(dateToUse);

  /************************************************************/
  this.compute=function (dateToUse)
  {    
    for(var i=0;i<currentAssignments.length;i++)
    {
      var row=currentAssignments[i];
      
      var globerId=row["Glober ID"];
      
      if (!isNumber(globerId))
      {
        addError("Invalid glober ID: "+globerId);
        continue;
      }
      
      var glober=getGlober(row["Glober ID"]);
      if (!glober)
        glober={Email:"N/A",Role:"N/A",Seniority:"N/A",Staff:false};
      
      var projectTag=row["Project TAG"];      
      var project=getProject(projectTag);
      
      //check for projects belonging to clients 
      if (project["Billing Flag"] && project["Client TAG"]!="GLO001")
      {
      }
    }
  }
        


  /************************************************************/
/*
Example:
How to save results
this.saveSummary=function (sheet)
  {
    for(var i=0;i<summaryList.length;i++)
    {
      var d=summaryList[i];
      row=[];
      for(var j=0;j<keysSummary.length;j++)
        row.push(d[keysSummary[j]]);
      
      sheet.appendRow(row);    

    }
  }
*/
  function isNumber(n) 
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
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
