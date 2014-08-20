
function Datamining_updateBestFits_cron()
{
  var logger = new CCPOLoggerClass("bestFit");
  logger.log("About to start...");
  
  var bestFitsClass = new BenchUpdateBestFitsClass();
  bestFitsClass.run();
  
  logger.log("Job complete.");
}

/*************************************************************************************************/
function BenchUpdateBestFitsClass() {

  /***********************************************************************************************/
  /* Match threshold. Only projects with "puntaje" over the given threshold will be considered   */
  /***********************************************************************************************/
  this._MATCH_THRESHOLD = "75";
  this._VERSION_NUMBER = "1.1__20131126";
  this._TEST = false;
  

  /* Public methods ******************************************************************************/
  this.availableSheet = (( this._TEST )?  SpreadsheetApp.getActiveSpreadsheet() : getBenchSpreadsheet()).getSheetByName("Available");
  
  this.ticketSheet = (( this._TEST )? SpreadsheetApp.getActiveSpreadsheet() : getBenchSpreadsheet()).getSheetByName("Tickets");
  
  this.run = function()
  {
    this._updateGlobersBestTicketFit();
    this._updateTicketsBestGloberFit();
  }
  
  /* Private methods *****************************************************************************/
  this._updateGlobersBestTicketFit = function()
  {
    var groupedSuggestionsWithValue = this._getGloberNameEmailAndProjects();
    this._updateBestFitToSheet(this.availableSheet, groupedSuggestionsWithValue);
  }
  
  /***********************************************************************************************/  
  this._updateTicketsBestGloberFit = function()
  {
    var groupedSuggestionsWithValue = this._getProjectNameAndGlobers();
    this._updateBestFitToSheet(this.ticketSheet, groupedSuggestionsWithValue);
  }
  
  /***********************************************************************************************/
  this._updateBestFitToSheet = function(destSheet, groupedSuggestionsWithValue)
  {
    var destSheetRows = getRows(destSheet);
    
    // Compile all built values into a vertical array sorted by entities as they came from destSheet
    var valuesList = new Array(destSheetRows.length);
    
    for( var i = 0; i < destSheetRows.length; i++ ) 
    {
      var key = groupedSuggestionsWithValue._hashFunction(destSheetRows[i]);

      // Some keys may have '#', specially ticket numbers. Remove them in order to avoid any possible conflict
      key = stripHashTag(key);
      
      // transform values to object[][]
      valuesList[i] = [];
      
      // Grouped entity from destSheet has matching suggestion?
      if( groupedSuggestionsWithValue[key] != undefined )
        valuesList[i][0] = groupedSuggestionsWithValue[key];
      else
        valuesList[i][0] = "";
    }  
    
    this._appendColumnToSheet(destSheet, valuesList);
  }
  
  /***********************************************************************************************/
  this._appendColumnToSheet = function(sheet, values)
  {
    var newColumnNdx = getHeaderIndexes(sheet)["Staffing Suggestions"];
    assert(newColumnNdx, "Column 'Staffing Suggestions' must be available in sheet " + sheet.getName());
    
    // Clear current data
    var currentRange = sheet.getRange(2, newColumnNdx, sheet.getMaxRows() - 1, 1);
    currentRange.clear();
    
    
    // update whole column
    var projectNamesNewColumnRange = sheet.getRange(2, newColumnNdx, values.length, 1);
    projectNamesNewColumnRange.setValues(values);
    
    // Adjust column width automatically
    sheet.autoResizeColumn(newColumnNdx);
  }
  
  /***********************************************************************************************/
  this._getGloberNameEmailAndProjects = function()
  {
    var groupedByObjs = this._getSuggestionsGroupByGlobers();
    return this._getGroupedSuggestionsWithScore(groupedByObjs, this._buildProjectNamesAndScores);
  }
  
  /***********************************************************************************************/
  this._getProjectNameAndGlobers = function()
  {
    var groupedByObjs = this._getSuggestionsGroupByTickets();
    return this._getGroupedSuggestionsWithScore(groupedByObjs, this._buildGloberNamesAndScores);
  }

  /***********************************************************************************************/
  this._getGroupedSuggestionsWithScore = function(groupedByObjs, suggestionNamesBuilder)
  {
    var values = {};
    values._hashFunction = groupedByObjs.hashFunction;  
    
    
    if( groupedByObjs != undefined && groupedByObjs.keys != undefined)
    {
      // Cycle through the keys and process the grouped values to compile a single text
      for(var i = 0; i < groupedByObjs.keys.length; i++ )
      {
        var key = groupedByObjs.keys[i];
        var namesCompiled = suggestionNamesBuilder(groupedByObjs.list[key]);
        values[key] = namesCompiled;
      }
    }
    
    return values;
  }
  
  /***********************************************************************************************/
  this._buildProjectNamesAndScores = function(projectArray)
  {
    var projectNames = "";
    if( projectArray != undefined ) for( var j = 0; j < projectArray.length; j++ )
    {
      var project = projectArray[j];
      projectNames = projectNames + project.Number + " " + project.Project + " (" + project.Client + ") at " + project.puntaje + "%" + "\n";
    }
    
    projectNames = projectNames.substring(0, projectNames.length - 1);
    return projectNames;
  }
  
  /***********************************************************************************************/
  this._buildGloberNamesAndScores = function(suggestionArray)
  {
    var names = "";
    if( suggestionArray != undefined ) for( var j = 0; j < suggestionArray.length; j++ )
    {
      var suggestion = suggestionArray[j];
      var username = suggestion.Email;
      if( suggestion.Email.indexOf("@") > 0 )
        username = suggestion.Email.split("@")[0];
      
      names = names + suggestion.Name + " (" + username + ") at " + suggestion.puntaje + "%" + "\n";
    }
    
    names = names.substring(0, names.length - 1);
    
    return names;
  }
  
  /***********************************************************************************************/
  /*             Devuelve un objeto que tiene dos propiedades: "list" y "keys"                   */
  /***********************************************************************************************/
  this._getSuggestionsGroupByGlobers = function()
  {
    var list = this._retrieveSuggestionsGroupedByHash(automaticSuggestionGloberHash);
    return list;
  }
  
  /***********************************************************************************************/
  this._getSuggestionsGroupByTickets = function()
  {
    var list = this._retrieveSuggestionsGroupedByHash(automaticSuggestionTicketHash);
    return list;
  }
  
  /***********************************************************************************************/
  this._retrieveSuggestionsGroupedByHash = function(hashFunction)
  {
    var automSugSheet = getDataminingSpreadsheet().getSheetByName("AutomaticSuggestion"); 
    
    var automSugRows = getRows(automSugSheet);
    var objMap = {};
    objMap.list = {};
    objMap.keys = new Array();
    objMap.hashFunction = hashFunction;
    
    for( var i = 0; i < automSugRows.length; i++ ) 
    {
      var automSugRow = automSugRows[i];
      
      if( automSugRow.puntaje < this._MATCH_THRESHOLD )
      {
        continue;
      }
      
      var rowHash = hashFunction(automSugRow);
      
      if( objMap.list[rowHash] == undefined )
      {
        objMap.list[rowHash] = [];
        objMap.keys.push(rowHash);
      }
      
      objMap.list[rowHash].push(automSugRow);
    }
    
    return objMap;
  }
  
  /***********************************************************************************************/
  function automaticSuggestionGloberHash(row) 
  {
    if( row.Email != "NH" )
      return toUpperCase(row.Email);
    else
      return toUpperCase(row.Name);
  }
  
  /***********************************************************************************************/
  function automaticSuggestionTicketHash(row) 
  {
    return row.Number;
  }
  
  /***********************************************************************************************/
}
