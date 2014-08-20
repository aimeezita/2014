//////////////////////////////////////////////////////
function test123456_()
{
  var logger=new CCPOLoggerClass("testing");
  logger.log("test bbb");
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOLoggerClass (processName,sheetName)
{
  var theSheet = getSheet(sheetName || "CronLogs");
  var theProcess=processName;
  
  function getSheet(sheetName) 
  {
     var spreadsheet=getLogSpreadsheet();
     assert(spreadsheet,"Log spreadsheet not found");
     var sheet= spreadsheet.getSheetByName(sheetName);
     assert(sheet,"Log sheet not found:"+sheetName);
     return sheet;
  }
  
  this.log=function (message) 
  {
     Logger.log(message);
     
    //DR Commented out saving in the spreadsheet 
    /*
     var values=[new Date(), theProcess, message];    
     theSheet.appendRow(values);
     SpreadsheetApp.flush();
     */
  }

}
//////////////////////////////////////////////////////
