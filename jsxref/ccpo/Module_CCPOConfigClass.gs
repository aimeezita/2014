var CCPOConfigClass = function (spreadsheetId)
{
  var inputFileId = spreadsheetId || '1jClpTtZoAEvkOsn0_Iupd4oDLdRkgj7SM3lCkF51Rs4';
  var spreadsheet = SpreadsheetApp.openById(inputFileId);
  assert(spreadsheet, 'Cannot open configuration spreadsheet');
  
  this.getConfig = function(configurationId) 
  {
    var sheet = spreadsheet.getSheetByName(configurationId);
    assert(sheet, 'Cannot open configuration: ' + configurationId);
    return getRows(sheet);
  };
};
