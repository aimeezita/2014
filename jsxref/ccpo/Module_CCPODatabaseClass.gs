//CCPODatabaseClass
var CCPODatabaseClass = function (tables) {
  //returns a new instance of the class if called without the new operator
  if(this instanceof CCPODatabaseClass === false) { return new CCPODatabaseClass(config); } 
    
  for(var i = 0; i < tables.length; i++) {
    //creates a function to retrieve the spreadsheet. Uses a self invoking function to create a new scope with the spreadsheet id value.
    this['get' + tables[i].name + 'Spreadsheet'] = (function (tableId) {
      return function() { 
        return SpreadsheetApp.openById(tableId); 
      }
    })(tables[i].id);
    
    //creates a function to retrieve a specific sheet in a spreadsheet. Uses a self invoking function to create a new scope with the spreadsheet id value.
    this['get' + tables[i].name + 'Sheet'] = (function(tableId) {
      return function (sheetName) { 
        return SpreadsheetApp.openById(tableId).getSheetByName(sheetName); 
      }
    })(tables[i].id);
  }
};

function initCCPODatabase () {  
  var config = new CCPOConfigClass();
  var tables = config.getConfig('Databases');
    
  var database = new CCPODatabaseClass(tables);
  
  //var spredsheet = database.getGloberSkillsSpreadsheet();
  //var sheet = database.getGloberSkillsSheet('Sheet1');
}
