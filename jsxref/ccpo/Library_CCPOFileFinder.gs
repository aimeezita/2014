/*
//Class GlobantProjects
function CCPOFileFinderClass ()
{

  this.getPublicBenchSpreadsheet=function () 
  {
     return SpreadsheetApp.openById("0AtYngM2DZCK7dDR0Mm41TlltaURfb05NUFVJWlJhYnc");
     assert(spreadsheet,"spreadsheet not found");
     return spreadsheet;
  }
}

var CCPOFileFinder=new CCPOFileFinderClass();

*/

/***************************************/
/***************************************/
/***************************************/
/***************************************/
function getSpreadsheetHandler(fileKey, fileName) 
{
  try{
      var spreadsheet = SpreadsheetApp.openById(fileKey);
      if (spreadsheet) return spreadsheet;
  }catch(e)
  {
  }
  throw "Cannot open "+fileName + " file.";
  
}


function getGloberSkillsSpreadsheet() 
{
  return getSpreadsheetHandler("1wy34em17Q2LbcwPZv6AYTO_wm1mSuBnysc2jMKBRxqs","GloberSkills");
}

function getReleasesSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndEZCNmpJcURxTWJYMnBhcGUtMC13dEE","Releases");
}

function getHeadCountSpreadsheet() 
{                               
  Logger.log("About to open headcount spreadsheet");
  return getSpreadsheetHandler("1CvLiQF3DIOMJNIEItMK7FwxUkyKkwy_oaaKdMDJ2r2s","HeadCount");
}

/***************************************/
function getReleasesSheet() 
{
  return getReleasesSpreadsheet().getSheetByName("Releases");
}
/***************************************/
function getReleasesResultsSheet() 
{
  return getReleasesSpreadsheet().getSheetByName("ReleasesResults");
}  
/***************************************/
function getReleasesProjectsSheet() 
{
  return getReleasesSpreadsheet().getSheetByName("Projects");
}  
/***************************************/
/***************************************/
/***************************************/
/***************************************/
function getLogSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndG53ZGRxWHBoQU1nRzFENjJNOXM2Y2c","Logs");
}

/***************************************/
function getAssignmentLogSheet() 
{
  return getLogSpreadsheet().getSheetByName("Assignment Log");
}


/***************************************/
function getNewHiresSpreadsheet() 
{
  return getSpreadsheetHandler("0ApSEGHql64yXdFNTMHNDVzRoWTZ1ZGh6UVB5Qms3OWc","NewHires");
}


/***************************************/
/***************************************/
/***************************************/
/***************************************/
function getAccountPrioritiesSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndFJKZ1NGRzlNYW4ydzNFOGpWTTRNdmc","AccountPriorities");
}

/***************************************/
function getAccountPrioritiesSheet() 
{
  return getAccountPrioritiesSpreadsheet().getSheetByName("Priority");
}

/***************************************/
/***************************************/
/***************************************/
/***************************************/
function getSalariesSpreadsheet() 
{
  return getSpreadsheetHandler("0Aj1eCbwZWuaXdDFWWkpqVjA4QTFqX1liOUJXVXAwcUE","SalariesSpreadsheet");
}
/***************************************/
function getSalariesSheet() 
{
  return getSalariesSpreadsheet().getSheetByName("ALL");
}    

/***************************************/
function getOrgUnitsSheet() 
{
  return getGlowImport2Spreadsheet().getSheetByName("OrgUnits");
}    

/***************************************/
function getAvailCheckerSheet() 
{
  return getTestingSpreadsheet().getSheetByName("DRAvailChecker");
}  
/***************************************/
function getTestingAvailableSheet() 
{
  return getTestingSpreadsheet().getSheetByName("Available");
}  
/***************************************/

/***************************************/
function getPublicBenchSpreadsheet() 
{
  return getSpreadsheetHandler("0AtYngM2DZCK7dDR0Mm41TlltaURfb05NUFVJWlJhYnc","PublicBench");
}
/***************************************/
function getPublicBenchSheet() 
{
  return getPublicBenchSpreadsheet().getSheetByName("Available");
}    
/***************************************/
function getPublicPipelineSheet() 
{
  return getPublicBenchSpreadsheet().getSheetByName("Pipeline");
}    
/***************************************/
function getPublicTicketSheet() 
{
  return getPublicBenchSpreadsheet().getSheetByName("Tickets");
}
/***************************************/
function getPublicStudiosSheet() 
{
  return getPublicBenchSpreadsheet().getSheetByName("Studios");
}
/***************************************/
function getPublicProjectSheet() 
{
  return getPublicBenchSpreadsheet().getSheetByName("Projects");
}
/***************************************/
/***************************************/
/***************************************/
/***************************************/
function getBenchSpreadsheetId() 
{
//  return "0AqajL6lY_OQndC1GTmlkMm9jZzQ1MFozUklmTG1kM3c"
  return "18Lj3jzw6mgkhX1_lyXQfTsKOTu4-ujvAsrEHOxszy0Q"

}

function getBenchSpreadsheet() 
{
  return getSpreadsheetHandler(getBenchSpreadsheetId(),"Bench");
}
/***************************************/
function getDashboardSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndEFvWGNTQW1RRzVOUGw2bjJMNmdWWnc","Dashboard");
}

/***************************************/
function getGlowImportSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndDB1NmFuaEZaTmxQWXFtLUp3YjBFUWc","GlowImports");
}

/***************************************/
function getGlowImport2Spreadsheet() 
{
//  return getSpreadsheetHandler("0AjgUaAY0-dtedFdJdzVGbTMyTm5BZU5Ic0ZMb2hwaVE","GlowImports2");
  return getSpreadsheetHandler("1RClZN_Fv9XdaQRciTH4JW3uP9KyR9SNMpzilDj3bj2I","GlowImports2");


}

/***************************************
function getProjectDispersionSpreadsheet() 
{
  var spreadsheet = SpreadsheetApp.openById("0AqajL6lY_OQndHRPZU5Qb1l0am1TWWY4THJaQzdDNmc");
  assert(spreadsheet,"ProjectDispersion spreadsheet not found");
  return spreadsheet;
}
**/

/***************************************/
function getTestingSpreadsheet() 
{
  return getSpreadsheetHandler("0AqajL6lY_OQndGNIR2JfNGFhQ1VScUZTWVZ4Ukg0WVE","Testing");
}



/**********************************************************************************************************************************************/
/************************************************************ Open Positions ******************************************************************/
/**********************************************************************************************************************************************/
function getOpenPositionsSpreadsheetId() {
  return "0AiPaPAJepRvRdDhOYmhJNk9lbWhjOW9SYS0wV0ZaY0E";
}
function getOpenPositionsSpreadsheet()
{
  return getSpreadsheetHandler(getOpenPositionsSpreadsheetId(),"Open Positions");
}
function getOpenPositionsAvailableSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("Available");
}
function getOpenPositionsAvailablePreviousSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("Available.previous");
}
function getOpenPositionsHistoricSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("Historic");
}
function getOpenPositionsClientDescriptionsSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("ClientDescriptions");
}
function getOpenPositionsPositionsDescriptionsSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("PositionDescriptions");
}
function getOpenPositionsPositionsApplyOPOffshoreSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("ApplyOPOffshore");
}
function getOpenPositionsPositionsApplyOPOnsiteSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("ApplyOPOnsite");
}
function getOpenPositionsPositionsGlobersSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("Globers");
}
function getOpenPositionsLocationDescriptionsSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("LocationDescription");
}
function getOpenPositionsHTMLPositionsSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("HTMLPositions");
}
function getOpenPositionsStaffingAreaSheet() 
{
  return getOpenPositionsSpreadsheet().getSheetByName("StaffingArea");
}


/**********************************************************************************************************************************************/
/******************************************************** Staffing Suggestions ****************************************************************/
/**********************************************************************************************************************************************/
function getGlobersSuggestionsSpreadsheet()
{
  return getSpreadsheetHandler("0AiPaPAJepRvRdEdyWGc1UHhSd1pKeXZnNlcyMmxtZXc","CCPOdb: Globers Suggestions");
}

function getGlobersSuggestionsMatchingsIgnoredSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("MatchingsIgnored");
}

function getGlobersSuggestionsLogsSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Log");
}

function getGlobersSuggestionsBadValuesSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("BadValues");
}

function getGlobersSuggestionsParametersSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Parameters");
}

function getGlobersSuggestionsSuggestionsSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Suggestions");
}

function getGlobersSuggestionsTicketsSuggestionsSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("TicketsSuggestions");
}
function getGlobersSuggestionsGlobersSuggestionsSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("GlobersSuggestions");
}

function getGlobersSuggestionsSuggestionsDetailsSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("SuggestionsDetails");
}

function getGlobersSuggestionsLocationsMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Locations.Mapping");
}

function getGlobersSuggestionsLocationsClientMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("LocationsClient.Mapping");
}

function getGlobersSuggestionsSkillsMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Skills.Mapping");
}

function getGlobersSuggestionsSenioritiesMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("Seniorities.Mapping");
}

function getGlobersSuggestionsEnglishLevelsMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("EnglishLevels.Mapping");
}

function getGlobersSuggestionsSkillsCompatibilityMappingSheet()
{
  return getGlobersSuggestionsSpreadsheet().getSheetByName("SkillsCompatibility.Mapping");
}
