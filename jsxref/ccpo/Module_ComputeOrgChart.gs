

function computeOrgChart_cron() 
{
  var computation=new CCPOComputeOrgChartClass();
  var results=computation.computeOrgChart();
  
  Logger.log("About to save orgChart");
  var outputSheet =  getTestingSpreadsheet().getSheetByName("OrgChart");
  assert(outputSheet,"Cannot open outputSheet");
  var headers=getSheetHeaders(outputSheet);
  saveSheetObjs(headers,results,outputSheet,1000,false);
  Logger.log("Org Chart Saved!");
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeOrgChartClass ()
{
  var errorList     = new CCPOErrorListClass();
  var projectMap    = computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap     = computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var globers       = getRows(getGlowImportSpreadsheet().getSheetByName("Globers"));
  var orgUnitMap    = computeMap(getOrgUnitsSheet(), "ID");
  
  /************************************************************/
  this.computeOrgChart=function ()
  {    
    var dateToUse     = new Date();  
    var assignments   = new CCPOAssignmentClass();
    var globerAssignmentsMap=assignments.getGloberAssignmentsMap(dateToUse);
    
    var orgChart=[];
    for(var i=0;i<globers.length;i++)
    {
      var glober=globers[i];
      var orgUnit=orgUnitMap[glober["Organizational Unit"]];
      assert(orgUnit,"Cannot find org unit: "+glober["Organizational Unit"]);

      
      if (useOrgUnitManager(orgUnit))
      {
        var globerReportsTo={
          globerId:glober["Glober ID"],
          globerEmail:glober.Email,
          orgUnit:getOrgUnitPath(orgUnit),
          role:glober["Role"],
          seniority:glober["Seniority"],
          staff:true
        }
      
        
        var reportsTo;
        var orgUnit2=orgUnit;        
        do{
          reportsTo=orgUnit2.Manager+"@globant.com";
          orgUnit2=orgUnitMap[orgUnit2["Parent ID"]];        
        }while (reportsTo==glober.Email && orgUnit2);
        
        globerReportsTo.reportsToEmail=reportsTo;
        globerReportsTo.reportsToId="TBD";
        
        //Logger.log(glober.Email+ " reports to "+reportsTo+"["+orgUnit.Name+"]");
        
        orgChart.push(globerReportsTo);
        
      }
      else
      {
        //Use assignments 
        
        var globerAssignments=globerAssignmentsMap[glober["Glober ID"]];

        if (!globerAssignments || globerAssignments.length<1)
        {
          Logger.log("No assignments for glober:"+glober.Email);
          continue;
        }
        
        for(var pos=0;pos<globerAssignments.length;pos++)
        {
          var assignment=globerAssignments[pos];
          var globerReportsTo={
            globerId:glober["Glober ID"],
            globerEmail:glober.Email,
            orgUnit:getOrgUnitPath(orgUnit),
            cantPMs:0,
            assignments:globerAssignments.length,
            role:glober["Role"],
            seniority:glober["Seniority"],
            percentage:assignment.Percentage,
            staff:false
          }

          var projectTag=assignment["Project TAG"];      
          var project=getProject(projectTag);
          if (!project)
          {
            Logger.log("Cannot find project tag: :"+assignment["Project TAG"]);
            continue;
          }

          globerReportsTo.project=project["Project"];
          if ("Delivery Director"==glober["Role"])
          {
            globerReportsTo.reportsToEmail=assignment["Business Unit"];
            orgChart.push(globerReportsTo);
            break; //stop looking at assignments.
          }

          if ("Project Managers"==orgUnit.Name)
          {
            globerReportsTo.reportsToEmail=project["Current Delivery Directors Emails"];
            orgChart.push(globerReportsTo);
            continue;
          }
          
          //check for projects belonging to clients 
          //if (project["Billing Flag"] && project["Client TAG"]!="GLO001")
          //{
            globerReportsTo.reportsToEmail=project["Current Project Managers Emails"];
            if (!isEmptyString(globerReportsTo.reportsToEmail))
            {
              globerReportsTo.cantPMs=globerReportsTo.reportsToEmail.split("-").length;
            }
              
          //}
          orgChart.push(globerReportsTo);
        }
        
      }
      
    }
    return orgChart;
  }
        
        
  /************************************************************/
  function getOrgUnitPath(orgUnit)
  {
    if (orgUnit.path) return orgUnit.path;
    if (orgUnit["Parent ID"]=="null")
    {
      orgUnit.path="";
    }  
    else
    {
      parentOrgUnit=orgUnitMap[orgUnit["Parent ID"]];
      orgUnit.path=getOrgUnitPath(parentOrgUnit)+"/"+orgUnit.Name;      
    }
    return orgUnit.path;
  }

    /************************************************************/
  function getProject(projectTag)
  {
//    assert(projectTag in projectMap,"Cannot find project:"+projectTag);
    return projectMap[projectTag];
  }

  /************************************************************/
  function useOrgUnitManager(orgUnit)
  {
    if (orgUnit.Staff=="TRUE")
      return true;
    
    //check for billable people: 70000169 ="Generic S"
    if (orgUnit["Parent ID"]=="70000169")
      return false;
    
    if (orgUnit.Name=="Project Managers")
      return false;
    
    return true;
  }
  
  /************************************************************/
  function getGlober(globerId)
  {
    //assert(globerId in globerMap,"Cannot find glober:"+globerId);
    return globerMap[globerId];
  }

}
//////////////////////////////////////////////////////
