/*   
/////////////////////////
// This one is executed periodically. 
// Its been set to once every 4 hours 
/////////////////////////
function syncDatamining_cron() 
{
  var logger=new CCPOLoggerClass("syncDatamining");
  logger.log("start syncDatamining");
  var dataminingSync=new SyncDataminingClass();
  

  dataminingSync.syncAvail();

  dataminingSync.syncTickets();
  
  //Sync Projects
  var sourceSheet=getGlowImportSpreadsheet().getSheetByName("Projects");
  var destSheet = getDataminingSpreadsheet().getSheetByName("Projects");
  copySheet(sourceSheet,destSheet);
  //end Projects
  
  dataminingSync.syncGlobers();

  
  //Sync Logs
  var sourceSheet=getLogSpreadsheet().getSheetByName("Assignment log");
  var destSheet = getDataminingSpreadsheet().getSheetByName("Assignment log");
  copySheet(sourceSheet,destSheet);

  //Sync MatchingToIgnore
  var sourceSheet=getBenchSpreadsheet().getSheetByName("MatchingsToIgnore");
  var destSheet = getDataminingSpreadsheet().getSheetByName("MatchingsToIgnore");
  copySheet(sourceSheet,destSheet);
  //end MatchingToIgnore
  
  
  logger.log("end syncDatamining");
}


function SyncDataminingClass ()
{

  ////////////////////////////////////////
  this.syncAvail =function ()
  {
    var filterRow=function(availValues)
    {
      //plan is in position 13 in the headers
      var planColumn=13;
      if (availValues[planColumn]) 
      {
        if (availValues[planColumn]=="Confirmed" || availValues[planColumn]=="Exit" || availValues[planColumn]=="Assigned" || availValues[planColumn]=="Plan: Account"|| availValues[planColumn]=="BookedInterno")
        {
          //Logger.log("filtering:"+availValues[0]);
          return true;
        }
      }
      
      return false;
    }
    
    var origSheet = getBenchSpreadsheet().getSheetByName("Available");
    var destSheet = getDataminingSpreadsheet().getSheetByName("Available");
    var headers=["Name","Email","%","Location","Skill","Seniority","Studio","English","Bench Start Date","Aging","Source","Assignment","Handler Team","Plan","Start Date","Assignment Plan Ticket #","Stage","SeniorityRange","Vacaciones"];
    
    const sortColumns=[2]; 
    copySheetColumns(origSheet,destSheet,headers,sortColumns,filterRow);
  }


  ////////////////////////////////////////
  this.syncTickets =function ()
  {
    var origSheet = getBenchSpreadsheet().getSheetByName("Tickets");
    var destSheet = getDataminingSpreadsheet().getSheetByName("Tickets");
    var headers=[
      "Number","Name","Handler","Submit Date","Update Date","Glow Submitter","Studio","Client","Project","Position","Seniority","Type of Assignment","Load","Start Date","Work Office","Estimated Travel Period","Replacement",
      "Stage","Aging","Priority","Handler Team","Staffing Lead","Recruitment Lead","Cluster"
    ];
    const sortColumns=[1];
    copySheetColumns(origSheet,destSheet,headers,sortColumns);
  }

  ////////////////////////////////////////
  this.syncGlobers =function ()
  {
    var origSheet = getBenchSpreadsheet().getSheetByName("Globers");
    var destSheet = getDataminingSpreadsheet().getSheetByName("Globers");
    var headers=["Glober ID","Email","Role","Seniority","Glober Office","English level"];
    const sortColumns=[2];
    copySheetColumns(origSheet,destSheet,headers,sortColumns);
  }
  
  ////////////////////////////////////////
  function copySheetColumns(origSheet,destSheet,headers,sortColumns,filterRow) 
  {
    const ColumnsToCopy=["Account","PriorityPoints"];
    
    assert(origSheet,"origSheet not found");
    assert(destSheet,"destSheet  not found");
    Logger.log("sync started:"+origSheet.getName());
    
    var values=origSheet.getDataRange().getValues();
    var headerIdx= getHeaderIndexes(origSheet);
    
    var columns=new Array(headers.length);
    for(var i=0;i<headers.length;i++)
    {
      columns[i]=headerIdx[headers[i]];
      if (!columns[i])  //not found!
      {
        throw "Header not found:"+headers[i];
        continue; 
      }
    }
    
    var destValues=[];
    for(var row=0;row<values.length;row++)
    {
      var rowValues=new Array(headers.length);
      for(var i=0;i<headers.length;i++)
        rowValues[i]=values[row][columns[i]-1];
      
      
      if (!filterRow || !filterRow(rowValues))
      {
        destValues.push(rowValues);
      }
    }
    
    
    destSheet.clear();
    destSheet.getRange(1,1,destValues.length,destValues[0].length).setValues(destValues);
    
    var origRange=origSheet.getRange(1, 1, 1,1)
    var destRange=destSheet.getRange(1, 1, 1,destValues[0].length);
    destRange.setBackground(origRange.getBackground()) ;
    destRange.setFontStyle(origRange.getFontStyle()) ;
    destRange.setFontWeight(origRange.getFontWeight()) ;
    
    destSheet.setFrozenColumns(1);
    destSheet.setFrozenRows(1);
    
    if (sortColumns && sortColumns.length>0)
    {
      sortValues=[];
      for(var i=0;i<sortColumns.length;i++)
      {
        var element={ column: sortColumns[i], ascending: true };
        sortValues.push(element);
      }
      destSheet.getRange(2,1,destSheet.getLastRow()-1,destSheet.getLastColumn()).sort(sortValues);
    }
    
    Logger.log("sync ended:"+origSheet.getName());
  }
}

**/
