

function __testAssignmentClass() 
{
  var assignments=new CCPOAssignmentClass();
  var dateToUse=new Date();
  /*
  var results=assignments.getAllAssignmentsForDate(dateToUse);
  Logger.log(results.length);
  */
  
  
/*
var results=assignments.pivotAssignmentsAtDate("Business Unit",dateToUse);
  sendTableEmailFromObjs("Headcount by BU: "+normalizeDate(dateToUse),"dario.robak@globant.com", results, ["key","count"]);
*/

var results=assignments.pivotAssignmentsAtDate("Client Name",dateToUse);
  results.sort(function (a,b) { return b.count-a.count;});
  results=results.map(function(item){ item.count=Math.round(item.count/100); return item}) ;

  sendTableEmailFromObjs("Headcount by Client: "+normalizeDate(dateToUse),"dario.robak@globant.com", results, ["key","count"]);

  //Project Studio
  //Client Name
  //Availability
  //glober.location
}

function createTableCurrentAssignments() 
{
  var assignments=new CCPOAssignmentClass();
  var dateToUse=new Date();
  var currentAssignments=assignments.getAllAssignmentsForDate(dateToUse);

  var outputSheet=getGlowImport2Spreadsheet().getSheetByName("CurrentAssignments");
  var headers=getSheetHeaders(outputSheet);
  saveSheetObjs(headers,currentAssignments,outputSheet,1000,false);
  

}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOAssignmentClass()
{
  var errorList     = new CCPOErrorListClass();
  var releasesSheet = getGlowImport2Spreadsheet().getSheetByName("ReleasesActualAndFuture");
  var releaseRows   = getRows(releasesSheet);
  releaseRows.sort(releasesSortFunction); 
  
  /************************************************************/
  function releasesSortFunction(a,b)
  {
    if (a["Glober ID"]<b["Glober ID"])
      return -1;
    if (a["Glober ID"]>b["Glober ID"])
      return 1;
    return (b.Percentage-a.Percentage);
  }
  
  /************************************************************/
  this.getAllAssignmentsForDate=function (dateToUse)
  {
    var results=[];
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      
      if (this.assignmentActiveAtDate(row,dateToUse))
          results.push(row);
    }
    return results;
  }
     
  /************************************************************/
  this.getGloberAssignmentsMap=function (dateToUse)
  {
    var results={};
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      
      if (!this.assignmentActiveAtDate(row,dateToUse))
          continue;
      
      var globerId=row["Glober ID"];
      
      var globerAssignments=results[globerId];
      if (globerAssignments)
        globerAssignments.push(row);
      else
        results[globerId]=[row];      
    }
    
    return results;
  }

  /************************************************************/
  this.assignmentActiveAtDate=function(assignment,dateToUse)
  {
    var date=normalizeDate(dateToUse);
    if (normalizeDate(assignment["Starting Date"])>date)
      return false;
    
    if (assignment["End Date"]=='null')
      return true;
    
    if(normalizeDate(assignment["End Date"])<date)
      return false;
    
    return true;
  }

  /************************************************************/
  this.pivotAssignmentsAtDate=function(field,dateToUse)
  {
    var today=new Date();
    var values=this.getAllAssignmentsForDate(dateToUse);
    var resultsMap={};
    for(var i=0;i<values.length;i++)
    {
      var row=values[i];
      
      var key=row[field];
      var item=resultsMap[key];
      if (!item)
      {
        item={dateComputed:today,date:dateToUse,key:key,count:0};
        resultsMap[key]=item;
      }
      item.count+=row.Percentage;
          
    }
    return Object.keys(resultsMap).map(function(key){ return resultsMap[key]}) ;
                               
  }

}
//////////////////////////////////////////////////////
