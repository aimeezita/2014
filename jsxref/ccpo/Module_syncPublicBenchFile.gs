
   
/////////////////////////
// This one is executed periodically. 
// Its been set to once every 4 hours 
/////////////////////////
function syncAllBench_cron() 
{
  var logger=new CCPOLoggerClass("syncAllBench");
  logger.log("start syncAllBench");
  var benchSync=new SyncAllBenchClass();
  
  benchSync.syncAvail();

  benchSync.syncTickets();
  benchSync.syncPipeline();
  //benchSync.syncAccountPriority(); not longer needed
  
  //Sync Tickets to Logs
  var sourceSheet=getBenchSpreadsheet().getSheetByName("Tickets");
  var destSheet = getLogSpreadsheet().getSheetByName("Copy of Tickets");
  copySheet(sourceSheet,destSheet);
  //end Sync Tickets to Logs

  logger.log("end syncAllBench");
}


function SyncAllBenchClass ()
{

  ////////////////////////////////////////
  /*
  this.syncAccountPriority =function () 
  {
    
    var origSheet = getAccountPrioritiesSheet();
    var destSheet = getBenchSpreadsheet().getSheetByName("Accounts");
    var headers=["Account","PriorityPoints"];
    const sortColumns=[1];
    copySheetColumns(origSheet,destSheet,headers,sortColumns);
    
  }
*/


  ////////////////////////////////////////
  this.syncAvail =function ()
  {
    var filterRow=function(availValues)
    {
      //plan is in position 10 in the headers
      var planColumn=10;
      var agingColumn=2;
      if (availValues[planColumn]) 
      {
        var plan=availValues[planColumn];
            if (
              plan=="confirmed" || plan=="confirmedantes" || plan=="confirmeddespues" || plan=="exit" || plan=="exitantes" ||plan=="exitdespues" || 
              plan=="assigned" || plan=="assigneddespues" ||plan=="assignedantes" ||
              plan=="bookedinterno" || plan=="tbd"
              )
            {
              //Logger.log("filtering:"+availValues[0]);
              return true;
            }
        
        
      }
      
      //filter when the aging is outside the certainty area
      if (availValues[agingColumn]<-14)
      {
        //Logger.log("filtering:"+availValues[0]);
        return true;
      }
      
      return false;
    }
    
    var origSheet = getBenchSpreadsheet().getSheetByName("Available");
    var destSheet = getPublicBenchSheet();
    var headers=["Name","Studio","Aging", "%", "Location","Skill", "Seniority","English","Handler Team","Source","Plan","Assignment Plan Ticket #","Bench Start Date", "SeniorityRange"];
    const sortColumns=[2,6,5]; //STUDIO, SKILL, LOCATION
    copySheetColumns(origSheet,destSheet,headers,sortColumns,filterRow);
  }


  ////////////////////////////////////////
  this.syncPipeline =function ()
  {
    var origSheet = getBenchSpreadsheet().getSheetByName("Pipeline");
    var destSheet = getPublicPipelineSheet();
    var headers=["Name","Location","Skill", "Seniority","English","Tentative Offer", "Handler Team", "Plan", "Assignment Plan Ticket #", "Assignment Plan Description", "Assignment Plan Client", "Recruiter"];
    const sortColumns=[3,2];
    copySheetColumns(origSheet,destSheet,headers,sortColumns);
  }



  ////////////////////////////////////////
  this.syncTickets =function ()
  {
    var origSheet = getBenchSpreadsheet().getSheetByName("Tickets");
    var destSheet = getPublicTicketSheet();
    var headers=[
      "Number","Name","Priority","BU", "Bucket (Weeks)","Days to comply SLA","Handler Team","Handler","Stage","Studio","Client","Project","Position","Seniority","Load","Start Date","Work Office","Glow Submitter","Replacement","Aging","Cluster","ProjectTag","ProjectState"
    ];
    const sortColumns=[4,11,12,1];
    copySheetColumns(origSheet,destSheet,headers,sortColumns);
  }


/****************************************/
  /*
function updateTicketsFromTrackstudio() {

  throw ("not implemented yet")
  var DestSheetName="test1";
  var OrigSheetName="Tickets Fran";
  var ColumnsToCopy=["Number","Name","Handler","Glow Submitter","Studio (S)","Client","Project","Position","Seniority","Load","Start Date","Work Office","Replacement"];
    
  
  var origSheet = getBenchSpreadsheet().getSheetByName(OrigSheetName);
  var destSheet = getBenchSpreadsheet().getSheetByName(DestSheetName);
  

  //Save the formulas at the end
  var saveFormulasRange=destSheet.getRange(2,ColumnsToCopy.length+1,1,4);
  var formulas=saveFormulasRange.getFormulas();
  
  ensureMinimumSize(destSheet,origSheet.getLastRow(),origSheet.getLastColumn());
  copyColumns(origSheet,destSheet,ColumnsToCopy);
  
  destSheet.setFrozenColumns(1);
  destSheet.setFrozenRows(1);

  //Restore the formulas at the end
  var maxRows=destSheet.getMaxRows();
  var i;
  for (i=1;i<destSheet.getMaxRows();i++)
  {
    saveFormulasRange=destSheet.getRange(i+1,ColumnsToCopy.length+1,1,4);
    saveFormulasRange.setFormulas(formulas);
  }

  //destSheet.sort(findColumnByHeader (destSheet,"Number"));
}
  */



  ////////////////////////////////////////
  function copySheetColumns(origSheet,destSheet,headers,sortColumns,filterRow) 
  {
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
        throw "Header not found:"+origSheet.getName()+"/"+headers[i];
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

    saveSheetValues(destValues,destSheet);
    //destSheet.clear();
    //destSheet.getRange(1,1,destValues.length,destValues[0].length).setValues(destValues);
    
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
  SpreadsheetApp.flush();
}

