

function compareHeadCountSnapshots_cron() 
{
  var computation=new CCPOComputeHeadCountClass();
  var fromDate="20140804",toDate="20140811";
  var comparations=computation.compareGlobantStaffingAtDates(fromDate,toDate);
  //Logger.log(comparation);
  
  var sheetName="Compare_"+fromDate+"_"+toDate;
  var outputSheet =getHeadCountSpreadsheet().getSheetByName(sheetName);
  if (!outputSheet)
  {
    outputSheet =getHeadCountSpreadsheet().insertSheet(sheetName);
    assert(outputSheet,"Cannot create sheet:"+sheetName);    
  }
  
  
  var headers=["fromDate","toDate","state","email","skill","seniority","location","percentStaff","percentNonBillable","percentBilled","percentBench"];
  saveSheetObjs(headers,comparations,outputSheet,1000);
}

///////////////////////////////////////////////////////////////////////////////
function computeHeadCount_cron() 
{
  var headCountSpreadsheet=getHeadCountSpreadsheet();
  var startingDate=findWeekday(0,addDaysToDate(-6,new Date()));  //find last Sunday! 
  var computation=new CCPOComputeHeadCountClass();
  var previousResults;
  for(var i=0;i<14;i++)
  {
    var dateToUse=new Date();
    if (i>0)
      dateToUse=findWeekday(1,addDaysToDate(7*i,startingDate)); //find Sunday!
    
    var results=computation.compute(dateToUse);
  
    if (i<4) //only save 4 sheets of detail
    {
      //var sheetName="HeadCount-"+getDateWeek(dateToUse);    
      var sheetName="HeadCount-"+normalizeDate(new Date());          
      
      var sheet =headCountSpreadsheet.getSheetByName(sheetName);
      if (!sheet)
      {
        headCountSpreadsheet.insertSheet(sheetName);
        sheet =headCountSpreadsheet.getSheetByName(sheetName);
      }
      computation.saveToSheet(sheet,dateToUse,previousResults, (i>0));
      previousResults=results;
    }
  }
  
  var sheet =headCountSpreadsheet.getSheetByName("HeadCountSummary");
  computation.saveSummary(sheet);
  
}

function findReleasesOnWeekEnd_cron() 
{
  var outputSheet =getTestingSpreadsheet().getSheetByName("ReleasesOnWeekEnd");
  var computation=new CCPOReleasesProcessingClass();
  computation.findReleasesOnWeekEnd(outputSheet);
}


function isGlobantBench(projectTag)
{
  if (projectTag=="NO1000") return true;
  if (projectTag=="GLB012") return true;
  return false;
}
 
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOReleasesProcessingClass ()
{
  var errorList=new Array();
  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var releasesSheet =getGlowImport2Spreadsheet().getSheetByName("ReleasesActualAndFuture");
  var releaseRows = getRows(releasesSheet);
  
  this.findReleasesOnWeekEnd=function (outputSheet)
  {
    var dateToUse=new Date();
    var results=[];
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      
      var endDate=row["End Date"];
      if (!endDate || endDate=='null') continue;

      //ignore releases in the past
      if (endDate.getTime()<dateToUse.getTime())
        continue;
      
      //ignore bench 
      var projectTag=row["Project TAG"];      
      if (isGlobantBench(projectTag)) continue;
        
      //check Friday or saturday
      var weekday=endDate.getDay();
      if (weekday!=5 && weekday!=6) continue;
      
      //if (row.Availability=="REPLACEMENT")
      
      results.push(row);
    }
    
    if (outputSheet)
    {
      headers=[
      "Glober ID","Glober Position","E-Mail","Client TAG","Client Name","Project TAG","Project Name","Project Studio","Starting Date","End Date","Percentage","Availability"
      ];
      saveSheetObjs(headers,results,outputSheet,1000);
    }
  }    
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeHeadCountClass ()
{
  var errorList=new Array();
  var globerAssignmentMap={};
  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var globerDataArray=[];
  var summaryList=[];
  var keysSummary=["DateComputed","Date","Week","percentStaff", "percentNonBillable", "percentBillable", 
                 "percentBilled","percentBench",
                 "percentNonBillableGlobant","percentNonBillableNoGlobant","percentNonBillableLicences","percentBilledUS","percentBilledUK"];
  

  /*
  proyectos de licencia, usarlos para separar lo nonbillable
  GLO001/GLO001/Globant/Lic Por Enfermedad
  GLO001/LI0641/Globant/Licencia Sin Sueldo
  GLO001/MA4398/Globant/Maternity Leave/
  GLO001/VA9265/Globant/Vacaciones
  */
  var projectTagsLicences=["GLO001","LI0641","MA4398","VA9265"];



  /************************************************************/
  this.compute=function (dateToUse)
  {
    var date=normalizeDate(dateToUse);
    
    var releasesSheet =getGlowImport2Spreadsheet().getSheetByName("ReleasesActualAndFuture");
    
    var releaseRows = getRows(releasesSheet);
  
    var map={};
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      
      try
      {
        if (normalizeDate(row["Starting Date"])>date)
          continue;
        
        
        if (row["End Date"]!='null' && (normalizeDate(row["End Date"])<date))
        continue;
        
      }
      catch(e)
      {
        Logger.log(row);
        throw e;
        
      }
      var globerId=row["Glober ID"];
      
      if (!isNumber(globerId))
      {
        addError("Invalid glober ID: "+globerId);
        continue;
      }
      
      var glober=getGlober(row["Glober ID"]);
      if (!glober)
        glober={Email:"N/A",Role:"N/A",Seniority:"N/A",Staff:false};
      //assert(glober,"Glober not found: "+row["Glober ID"]);
      
      var globerData=map[globerId];
      if (!globerData)
      {
        globerData={globerId: globerId, email:glober.Email, rol:glober.Role, seniority:glober.Seniority, ouStaff: glober.Staff, 
                    percentStaff:0,percentNonBillable:0,percentBillable:0,percentBilled:0,percentBench:0,nonBillableProject:"",
                    percentNonBillableGlobant:0,percentNonBillableNoGlobant:0,percentBilledUS:0,percentBilledUK:0,percentNonBillableLicences:0}
        map[globerId]=globerData;        
      }
      
      var percent=row["Percentage"];
      var projectTag=row["Project TAG"];      
      var project=getProject(projectTag);
      if (isGlobantBench(projectTag))
      {
        globerData.percentBillable+=percent;
        globerData.percentBench+=percent;
        
        if (glober.Staff)
        {
          addError("Staff glober in bench: "+glober.Email);
          //Logger.log(normalizeDate(row["Starting Date"])+", "+date)
          //Logger.log(row);
          //break;
        }
      }
      else
      {
        //Logger.log(project);
        if (project["Billing Flag"] && project["Client TAG"]!="GLO001")
        {
          globerData.percentBillable+=percent;
          globerData.percentBilled+=percent;
          
          if (!isEmptyString(glober["Glober Office"]) && glober["Glober Office"].indexOf("EU")==0)
              globerData.percentBilledUS+=percent;
          
          if (!isEmptyString(glober["Glober Office"]) && glober["Glober Office"].indexOf("UK")==0)
              globerData.percentBilledUK+=percent;
        }
        else
        {
          if (glober.Staff)
            globerData.percentStaff+=percent;
          else
          {
            globerData.percentNonBillable+=percent;
             
            if (project["Client TAG"]=="GLO001")
            {
              if (projectTagsLicences.indexOf(projectTag)>=0)                
                globerData.percentNonBillableLicences+=percent  ;
              else
                globerData.percentNonBillableGlobant+=percent  ;
            }
            else
              globerData.percentNonBillableNoGlobant+=percent  ;
         
          }
          globerData.nonBillableProject=project["Client TAG"]+"/"+project["Project Tag"]+"/"+project["Client"]+"/"+project["Project"]+"/("+percent+"%)";
        }

      }
    }
    
    globerDataArray=[];
    for (var key in map)
    {
      var globerData=map[key];
      globerDataArray.push(globerData);
      //Logger.log(globerData);
    }

    computeSummary(dateToUse,globerDataArray);

    return map;
  }
        

  /************************************************************/
  this.saveToSheet=function (sheet,dateUsed,previousResults,appendToEnd)
  {
    var date=normalizeDate(dateUsed);
    var dateComputed=normalizeDate(new Date());
    
    var values=[];
    var headers=["DateComputed","Date","globerId", "email","rol", "seniority","ouStaff","percentStaff", "percentNonBillable", "percentBillable", 
                 "percentBilled","percentBench", "nonBillableProject",
                 "percentNonBillableGlobant","percentNonBillableNoGlobant","percentBilledUS","percentBilledUK","percentNonBillableLicences"];
    
    if (!appendToEnd)  //Only add headers when we clear the sheet 
      values.push(headers);    
    
    for(var i=0;i<globerDataArray.length;i++)
    {
      row=[dateComputed,date];
      var d=globerDataArray[i];

      //if previosResults!=null only save differences
      var globerDataPrevious;
      if (previousResults)
        globerDataPrevious=previousResults[d.globerId];
      if (globerDataPrevious)
      {
        var globerDataDifferences={}
        
        var allZero=true;

        for(var j=2;j<headers.length;j++)
        {
          if (headers[j].indexOf("percent")==0) //if this is a percent value compute difference
          {
            var difference=d[headers[j]]-globerDataPrevious[headers[j]];
            globerDataDifferences[headers[j]]=difference;
            if (difference!=0)
              allZero=false; 
          }
          else
            globerDataDifferences[headers[j]]=d[headers[j]];
        }
        if (allZero)
          continue;
        d=globerDataDifferences;
      }

      for(var j=2;j<headers.length;j++)
        row.push(d[headers[j]]);
      values.push(row);
    }
    saveSheetValues(values,sheet,1000,appendToEnd);
  }

  /************************************************************/
  this.saveSummary=function (sheet)
  {
    //var values=[];
    //values.push(keysSummary);
        
    for(var i=0;i<summaryList.length;i++)
    {
      var d=summaryList[i];
      row=[];
      for(var j=0;j<keysSummary.length;j++)
        row.push(d[keysSummary[j]]);
      
      //values.push(row);
      sheet.appendRow(row);    

    }
    //saveSheetValues(values,sheet,1000);
  }

  function isNumber(n) 
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  

  /************************************************************/
  function addAllValues(key)
  {
    var sum=0;
    for(var i=0;i<globerDataArray.length;i++)
        sum+=globerDataArray[i][key];
    return sum;    
  }

  /************************************************************/
  function computeSummary(dateUsed)
  {
    Logger.log("Computing summary");
    var date=normalizeDate(dateUsed);
    var dateComputed=normalizeDate(new Date());

    var summary={DateComputed:dateComputed,Date:date,Week:getDateWeek(dateUsed)};
    for(var j=3;j<keysSummary.length;j++)
    {
      var key=keysSummary[j];
      summary[key]=addAllValues(key)/100;      
    }
    summaryList.push(summary);
    Logger.log("End computing summary");
    
  }  
    
  /************************************************************/
  function computeMap(sourceSheet, keyHeaderName,functionToCall)
  {
    Logger.log("Computing map:"+sourceSheet.getName());
    var rows = getRows(sourceSheet);
  
    var map={};
    for(var i=0;i<rows.length;i++)
    {
      var row=rows[i];
      var key=row[keyHeaderName];
      if (functionToCall)      functionToCall(row);
      map[key]=row;
    }
    Logger.log("End Computing map:"+sourceSheet.getName()+": "+Object.keys(map).length);
    return map;
  }

  function addError(errorMsg)
  {
    errorList.push(errorMsg);
    Logger.log(errorMsg);
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

  
  /************************************************************/
  /* parameter dates are normalized. ex: 20140427 */
  this.compareGlobantStaffingAtDates=function (fromDate, toDate)
  {
    var sheetName="HeadCount-"+fromDate;    
    var sheet =getHeadCountSpreadsheet().getSheetByName(sheetName);
    assert(sheet, "cannot open sheet:"+sheetName);
    var fromDateRows=getRows(sheet,compareGlobantStaffingAtDatesFilter);
    
    sheetName="HeadCount-"+toDate;    
    sheet =getHeadCountSpreadsheet().getSheetByName(sheetName);
    assert(sheet, "cannot open sheet:"+sheetName);
    var toDateRows=getRows(sheet,compareGlobantStaffingAtDatesFilter);
    
    //Logger.log("fromDateRows:"+fromDateRows.length);
    //Logger.log("toDateRows:"+toDateRows.length);
    fromDateRows.sort(function(a,b){ return a.globerId-b.globerId});
    toDateRows.sort(function(a,b){ return a.globerId-b.globerId});
    
    // Compare both arrays
    var posTo=0,posFrom=0;
    var results=[];
    while (posFrom<fromDateRows.length || posTo<toDateRows.length)
    {
      var comparation;
      if (posFrom>=fromDateRows.length)
      {
        comparation=getComparation("NEWHIRE",null,toDateRows[posTo]);
        posTo++;
      }
      else if (posTo>=toDateRows.length)
      {
        comparation=getComparation("EXIT",fromDateRows[posFrom],null);
        posFrom++;
      }
      else if (fromDateRows[posFrom].globerId<toDateRows[posTo].globerId)
      {
        comparation=getComparation("EXIT",fromDateRows[posFrom],null);
        posFrom++;
      }
      else if (fromDateRows[posFrom].globerId>toDateRows[posTo].globerId)
      {
        comparation=getComparation("NEWHIRE",null,toDateRows[posTo]);
        posTo++;
      }
      else
      {
        assert(fromDateRows[posFrom].globerId==toDateRows[posTo].globerId, "Glober IDs must match at this point");
        comparation=getComparation("CHANGE",fromDateRows[posFrom],toDateRows[posTo]);
        posTo++;
        posFrom++;
     }
      
      if (!comparation.areEqual)
      {
        comparation.fromDate=fromDate;        
        comparation.toDate=toDate;        
        results.push(comparation);
        Logger.log(comparation.state+":"+comparation.email);
       
      }
    }
    return results;
  }
  

  
  function getComparation(state,row1,row2)
  {
    var comparation={state:state};
    if (row1) 
    {
      comparation.email=row1.email;
      comparation.globerId=row1.globerId;
      comparation.seniority=row1.seniority;
      comparation.skill=row1.rol;
    }
    else 
    {
      comparation.email=row2.email;
      comparation.globerId=row2.globerId;
      comparation.seniority=row2.seniority;
      comparation.skill=row2.rol;
    }
    comparation.glober=getGlober(comparation.globerId);
    if (comparation.glober)
    {
      comparation.location=comparation.glober["Glober Office"];
    }
    
    var areEqual=true;
    var keys=["percentStaff","percentNonBillable","percentBilled","percentBench"];
    for(var j=0;j<keys.length;j++)
    {
      var key=keys[j];
      var row1Value=row1?row1[key]:0;
      var row2Value=row2?row2[key]:0;
      comparation[key]=row2Value-row1Value;
      if (comparation[key]>.009 || comparation[key]<-.009) 
      {
        areEqual=false;
      }
    }
    //comparation.fromDateRow=row1;
    //comparation.toDateRow=row2;
    comparation.areEqual=areEqual;
    return comparation;
  }
  
  function compareGlobantStaffingAtDatesFilter(row)
  {
    //only accept rows that represent the state at the date computed
    //var filterRow=(row.DateComputed==row.Date);
    //Logger.log("filter: "+row.DateComputed+" - "+row.Date+" - "+(filterRow));
    return (row.DateComputed==row.Date);
  }
  
}
//////////////////////////////////////////////////////
