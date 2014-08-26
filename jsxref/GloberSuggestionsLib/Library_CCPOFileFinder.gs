function getGlobersSuggestionsSpreadsheet()                     { return getSpreadsheetHandler("0AiPaPAJepRvRdEdyWGc1UHhSd1pKeXZnNlcyMmxtZXc","Globers suggestions"); }
function getGlobersSuggestionsMatchingsIgnoredSheet()           { return getGlobersSuggestionsSpreadsheet().getSheetByName("MatchingsIgnored"); }
function getGlobersSuggestionsLogsSheet()                       { return getGlobersSuggestionsSpreadsheet().getSheetByName("Log"); }
function getGlobersSuggestionsBadValuesSheet()                  { return getGlobersSuggestionsSpreadsheet().getSheetByName("BadValues"); }
function getGlobersSuggestionsParametersSheet()                 { return getGlobersSuggestionsSpreadsheet().getSheetByName("Parameters"); } 
function getGlobersSuggestionsSuggestionsSheet()                { return getGlobersSuggestionsSpreadsheet().getSheetByName("Suggestions"); } 
function getGlobersSuggestionsTicketsSuggestionsSheet()         { return getGlobersSuggestionsSpreadsheet().getSheetByName("TicketsSuggestions"); }
function getGlobersSuggestionsGlobersSuggestionsSheet()         { return getGlobersSuggestionsSpreadsheet().getSheetByName("GlobersSuggestions"); }
function getGlobersSuggestionsSuggestionsDetailsSheet()         { return getGlobersSuggestionsSpreadsheet().getSheetByName("SuggestionsDetails"); }
function getGlobersSuggestionsLocationsMappingSheet()           { return getGlobersSuggestionsSpreadsheet().getSheetByName("Locations.Mapping"); } 
function getGlobersSuggestionsLocationsClientMappingSheet()     { return getGlobersSuggestionsSpreadsheet().getSheetByName("LocationsClient.Mapping"); } 
function getGlobersSuggestionsSkillsMappingSheet()              { return getGlobersSuggestionsSpreadsheet().getSheetByName("Skills.Mapping"); } 
function getGlobersSuggestionsSenioritiesMappingSheet()         { return getGlobersSuggestionsSpreadsheet().getSheetByName("Seniorities.Mapping"); } 
function getGlobersSuggestionsEnglishLevelsMappingSheet()       { return getGlobersSuggestionsSpreadsheet().getSheetByName("EnglishLevels.Mapping"); } 
function getGlobersSuggestionsSkillsCompatibilityMappingSheet() { return getGlobersSuggestionsSpreadsheet().getSheetByName("SkillsCompatibility.Mapping"); }
function getGlowImports2Spreadsheet()                           { return getSpreadsheetHandler("1RClZN_Fv9XdaQRciTH4JW3uP9KyR9SNMpzilDj3bj2I","Glow imports 2"); } 
function getGlowImports2ReleasesSheet()                         { return getGlowImports2Spreadsheet().getSheetByName("ReleasesActualAndFuture"); }
function getLogSpreadsheet()                                    { /* return getActiveSpreadsheet(); */ return getSpreadsheetHandler("0AqajL6lY_OQndG53ZGRxWHBoQU1nRzFENjJNOXM2Y2c","LOGS") } 
function getAssignmentLogSheet()                                { return getLogSpreadsheet().getSheetByName("Assignment Log"); } 
function getAccountPrioritiesSpreadsheet()                      { return getSpreadsheetHandler("0AqajL6lY_OQndFJKZ1NGRzlNYW4ydzNFOGpWTTRNdmc","AccountPriorities"); } 
function getAccountPrioritiesSheet()                            { return getAccountPrioritiesSpreadsheet().getSheetByName("Priority"); } 
function getPublicBenchSpreadsheet()                            { return getSpreadsheetHandler("18Lj3jzw6mgkhX1_lyXQfTsKOTu4-ujvAsrEHOxszy0Q","PublicBench"); } 
function getPublicBenchSheet()                                  { return getPublicBenchSpreadsheet().getSheetByName("Available"); }    
function getPublicPipelineSheet()                               { return getPublicBenchSpreadsheet().getSheetByName("Pipeline"); }    
function getPublicTicketSheet()                                 { return getPublicBenchSpreadsheet().getSheetByName("Tickets"); }
function getPublicStudiosSheet()                                { return getPublicBenchSpreadsheet().getSheetByName("Studios"); }
function getPublicProjectSheet()                                { return getPublicBenchSpreadsheet().getSheetByName("Projects"); }
function getPublicGlobersSheet()                                { return getPublicBenchSpreadsheet().getSheetByName("Globers"); }
function getPublicMatchingToIgnoreSheet()                       { return getPublicBenchSpreadsheet().getSheetByName("MatchingsToIgnore"); }
function getBenchSpreadsheetId()                                { return "18Lj3jzw6mgkhX1_lyXQfTsKOTu4-ujvAsrEHOxszy0Q";/***0AqajL6lY_OQndC1GTmlkMm9jZzQ1MFozUklmTG1kM3c***/ } 
function getBenchSpreadsheet()                                  { return getSpreadsheetHandler(getBenchSpreadsheetId(),"Bench"); }
function getDashboardSpreadsheet()                              { return getSpreadsheetHandler("0AqajL6lY_OQndEFvWGNTQW1RRzVOUGw2bjJMNmdWWnc","Dashboard"); } 
function getGlowImportSpreadsheet()                             { return getSpreadsheetHandler("0AqajL6lY_OQndDB1NmFuaEZaTmxQWXFtLUp3YjBFUWc","GlowImports"); } 
function getGlowImport2Spreadsheet()                            { return getSpreadsheetHandler("0AjgUaAY0-dtedFdJdzVGbTMyTm5BZU5Ic0ZMb2hwaVE","GlowImports2"); } 
function getDataminingSpreadsheet()                             { return getSpreadsheetHandler("0AqajL6lY_OQndGNIR2JfNGFhQ1VScUZTWVZ4Ukg0WVE","DataMining"); } 

function getActiveSpreadsheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet)
    return spreadsheet
  else
    throw "Cannot open ActiveSpreadsheet";
}

function getSpreadsheetHandler(fileKey, fileName) {
  try{
    var spreadsheet = SpreadsheetApp.openById(fileKey);
    if (spreadsheet) { return spreadsheet };
  } catch(e) { }
  throw "Cannot open " + fileName + " file."; 
}

