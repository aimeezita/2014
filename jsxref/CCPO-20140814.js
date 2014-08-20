// source tab Code.gs

function myFunction()
{
  Logger.log("current project has " + ScriptApp.getProjectTriggers().length + " triggers");
  var allTriggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < allTriggers.length; i++)
  {
    var t=allTriggers[i];
    Logger.log("Trigger:"+t.getTriggerSource()+"/"+t.getEventType()+"/"+t.getHandlerFunction()+"/"+t.getTriggerSourceId());

  }


//  Logger.log(GmailApp.getAliases());

/*var a1=new aatest1Class();
  Logger.log("a1->"+a1.convertToString());
  var a2=new aatest1Class();
  Logger.log("a2->"+a2.convertToString());
  a1.set_ab(10,20);
  Logger.log("a1->"+a1.convertToString());
  Logger.log("a2->"+a2.convertToString());
*/
}









// source tab UNUSED_AvailQuery.gs

/*

function processAvailQueryEmails()
{
  var threads = GmailApp.search('in:inbox', 0, 100);

  var label = GmailApp.getUserLabelByName("processed");

    Logger.log("a");
  for (var x=0; x<threads.length; x++)
  {
    var messages = threads[x].getMessages();
    Logger.log(threads[x].getFirstMessageSubject());
    for (var y=0; y<messages.length; y++)
    {
        var msg = messages[y];
        var strQuery=msg.getSubject() +" "+msg.getBody();
        var values=getAvailGlobers(strQuery);
        var strHTMLTable=toHTMLTable(values, ["Name","Studio", "%", "Location","Skill", "Seniority","English","Handler Team","Source","Plan","Assignment Plan Ticket #","Bench Start Date","Aging"]);
        Logger.log(strHTMLTable);

    }
    //threads[x].markRead();
    //threads[x].addLabel(label);
    //threads[x].moveToArchive();
  }
}


function answerEmailToSender(email, subject,body,htmlBody)
{

  if(!htmlBody)
    MailApp.sendEmail(email, subject, body);

}


function toHTMLTable(values, headers)
{
  var strTable="<table border='1'><tr>";
  for(var i=0;i<headers.length;i++)
    strTable+="<th>"+headers[i]+"</th>";
  strTable+="</tr>";


  for(var j=0;j<values.length;j++)
  {
    var theRow=values[j];
    strTable+="<tr>";
    for(var i=0;i<headers.length;i++)
      strTable+="<td>"+theRow[headers[i]]+"</td>";
    strTable+="</tr>";

  }
  strTable+="</table>";
  return strTable;
}


function test111()
{
 var values=getAvailGlobers("PHP cordoba");
  var strHTMLTable=toHTMLTable(values, ["Name","Studio", "%", "Location"]);//,"Skill", "Seniority","English","Handler Team","Source","Plan","Assignment Plan Ticket #","Bench Start Date","Aging"]);
        Logger.log(strHTMLTable);
}


function getAvailGlobers(strQuery)
{
  var sheet = CCPOFileFinder.getPublicBenchSpreadsheet().getSheetByName("Available");
  var rowValues=getRows(sheet);
  var filteredResults=[];

  if (strQuery.length<1) return filteredResults;

  var wordsToSearch=strQuery.toLowerCase().trim().split(" ");
  if (wordsToSearch.length<1) return filteredResults;


  for(var j=0;j<rowValues.length;j++)
  {
    var theRow=rowValues[j];
    var rowAsString="";
    for(var key in theRow)
      rowAsString+=theRow[key]+" ";
    rowAsString=rowAsString.toLowerCase();
    var ignoreRow=false;
    for(var i=0;i<wordsToSearch.length;i++)
    {
      if (wordsToSearch[i] && wordsToSearch[i].length>0 && rowAsString.indexOf(wordsToSearch[i])<0)
      {
        //word not found, discard row
        ignoreRow=true;
        break;
      }
    }
    if (!ignoreRow)
      filteredResults.push(theRow);
  }
  //Logger.log(filteredResults);

  return filteredResults;
}


*/








// source tab Library_GlobantUtils.gs

/**************************************************/
/**************************************************/
function assert(c,msg)
{
  if (!c)
    throw msg;
}

/**************************************************/
function compareStrings(str1,str2)
{
  if (isEmptyString(str1))
    return isEmptyString(str2)?0:-1;
  if (isEmptyString(str2))
    return 1;
  if (str1<str2) return -1;
  if (str1>str2) return 1;
  return 0;
}

/**************************************************/
function compareDates(date1,date2)
{
  if (!date1)
    return (!date2)?0:-1;
  if (!date2)
    return 1;
  return date1.getTime()-date2.getTime();
}

/**************************************************/
function obfuscateString(str)
{
  if (isEmptyString(str)) return "";
//  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,str, Utilities.Charset.US_ASCII);
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512,str, Utilities.Charset.US_ASCII);
  return Utilities.base64Encode(digest).substr(0,50).toLowerCase();

}

/**************************************************/
function isEmptyString(str)
{
  if (!str) return true;
  return 0===str.length || ""===str.trim();
}

/**************************************************/
function convertDictionaryToArray(values)
{
  var resultArray=[];
  for (var key in values)
  {
    var value=values[key];
    if (value)
      resultArray.push(value);
  }
  return resultArray;
}


/**************************************************/
function ensureMinimumSize(destSheet,rows,columns)
{
  if (destSheet.getMaxRows()<rows)
    destSheet.insertRows(destSheet.getMaxRows(),rows-destSheet.getMaxRows());

  if (destSheet.getMaxColumns()<columns)
    destSheet.insertColumns(destSheet.getMaxColumns(),columns-destSheet.getMaxColumns());

}
/**************************************************/

function cloneSimpleObject(obj)
{
  var clone = {};
  for(var i in obj) {
    if(typeof(obj[i])=="object" && obj[i] != null)
      clone[i] = cloneObject(obj[i]);
    else
      clone[i] = obj[i];
  }
  return clone;
}
/**************************************************/
function copyColumns(origSheet,destSheet,ColumnsToCopy)
{
  destSheet.clear()

  var cont;
  for(cont=0;cont<ColumnsToCopy.length;cont++)
  {
    var column=findColumnByHeader(origSheet, ColumnsToCopy[cont]);
    if (column<0) continue; //not found!
    copyColumn (origSheet, destSheet, column, cont+1)

  }
  SpreadsheetApp.flush();
}

/**************************************************/
function findColumnByHeader (sheetObject, header)
{

  var lastCol = sheetObject.getLastColumn();
  var headers=sheetObject.getRange(1,1,1,lastCol).getValues()[0];
  var cont;
  for(cont=0;cont<lastCol;cont++)
  {
    if (headers[cont]==header)
      return cont+1;
  }
  Browser.msgBox("'"+header +"' header not found!");
  return -1;

}

/**************************************************/
function copyColumn (origSheetObject, destSheetObject, origColNumber, destColNumber)
{
  var origLastRow = origSheetObject.getLastRow();

  var origRange=origSheetObject.getRange(1, origColNumber, origLastRow,1)
  var destRange=destSheetObject.getRange(1, destColNumber, origLastRow,1);
  //origRange.copyTo(destRange);

  var values = origRange.getValues();
  destRange.setValues(values);

  //var formulas = origRange.getFormulas();
  //destRange.setFormulas(formulas);

  //Copio formato header
  origRange=origSheetObject.getRange(1, origColNumber, 1,1)
  destRange=destSheetObject.getRange(1, destColNumber, 1,1);
  destRange.setBackground(origRange.getBackground()) ;
  destRange.setFontStyle(origRange.getFontStyle()) ;
  destRange.setFontWeight(origRange.getFontWeight()) ;
}

/**************************************************/
/**************************************************/
/**************************************************/
/**************************************************/
/**********************************************************/
/**********************************************************/
/**********************************************************/
function getCellValue(sheet,rowNumber,colNumber)
{
  return sheet.getRange(rowNumber,colNumber).getValue();
}

/**********************************************************/
function setCellValue(sheet,rowNumber,colNumber,value)
{
  return sheet.getRange(rowNumber,colNumber).setValue(value);
}

/**********************************************************/
function getHeaderIndexes(sheet)
{

  var lastCol = sheet.getLastColumn();
  var headers=sheet.getRange(1,1,1,lastCol).getValues()[0];
  var headerIdx={};

  for(var cont=0;cont<headers.length;cont++)
  {
    headerIdx[headers[cont]]=cont+1;

  }
  return headerIdx;
}
/**********************************************************/
function getSheetHeaders(sheet)
{

  var lastCol = sheet.getLastColumn();
  var headers=sheet.getRange(1,1,1,lastCol).getValues()[0];
  return headers;
}

/**********************************************************/
function getRowObject(origSheet,rowNumber,headers)
{
  var cont;
  var rowObj={};
  var rowValues=origSheet.getRange(rowNumber,1,1,origSheet.getMaxColumns()).getValues();

  for(cont=0;cont<headers.length;cont++)
  {
    var column=findColumnByHeader(origSheet, headers[cont]);
    if (column<0) continue; //not found!
    //Logger.log((headers[cont] + ":"+rowValues[0][column-1]));
    rowObj[headers[cont]]=rowValues[0][column-1];

  }

  return rowObj;

}


/**********************************************************/
function getRowsWithHeaders(origSheet,headers)
{
  var cont;
  var AllValues=origSheet.getDataRange().getValues();
  var allRows=new Array(AllValues.length);

  var headerIdx={};
  for(cont=0;cont<headers.length;cont++)
  {
    var idx=findColumnByHeader(origSheet, headers[cont]);

    headerIdx[cont]=idx;
    if (headerIdx[cont]<0)
      throw ("Header not found:"+headers[cont]);
  }

  for(i=0;i<AllValues.length;i++)
  {
    var row=AllValues[i];
    var rowObj={};

    for(cont=0;cont<headers.length;cont++)
    {
      var column=headerIdx[cont]
      rowObj[headers[cont]]=row[column-1];
    }
    allRows[i]=rowObj;
  }
  return allRows;

}


/**********************************************************/
/*
filterFunction: can be null. rows where filterFunction(row) return false wont be returned
*/
function getRows(sheet,filterFunction)
{
  var cont;
  var AllValues=sheet.getDataRange().getValues();
  var allRows=new Array();
  var headers=AllValues[0];

  for(i=1;i<AllValues.length;i++)
  {
    var row=AllValues[i];
    var rowObj={};
    rowObj.rowID=i+1;
    for(cont=0;cont<row.length;cont++)
    {
      rowObj[headers[cont]]=row[cont];
    }
    //Logger.log(rowObj);

    if (filterFunction)
    {
      if (!filterFunction(rowObj))
        continue;
    }
    allRows.push(rowObj);

  }

  return allRows;

}




/**********************************************************/
function lookForValueInRows(valueToLookFor,rowValues,rowHeader)
{
  for(var j=0;j<rowValues.length;j++)
  {
    var theRow=rowValues[j];
    var theRowValue=theRow[rowHeader];

    if(theRowValue == valueToLookFor)
      return j;
  }
  return -1;
}

/**********************************************************/
function lookForValuesInRows(valuesToLookFor,rowValues,rowHeaders)
{
  for(var j=0;j<rowValues.length;j++)
  {
    var theRow=rowValues[j];

    for(var i=0;i<rowHeaders.length;i++)
    {
      var theRowValue=theRow[rowHeaders[i]];

      if(theRowValue != valuesToLookFor[i])
      {
        break;
      }
    }
    if (i==rowHeaders.length) return j;
  }
  return -1;
}


/******************************************************/
function replaceText(msgBody, tags, data)
{
  for (var i = 0; i < tags.length; i++)
  {
    // format tag
    var str_src = "##" + tags[i] + "##";
    var str_dest = data[i];
    //Browser.msgBox(str_src)
    //Browser.msgBox(str_dest)
    msgBody = msgBody.split(str_src).join(str_dest);
  }
  return msgBody;
}


/******************************************************/
function copySheet(sourceSheet,destSheet,step)
{

/*
this is the code without doing de copy in chunks.
doesnt work well with big arrays
  var values=sourceSheet.getDataRange().getValues();
  destSheet.clear();
  destSheet.getRange(1,1,values.length,values[0].length).setValues(values);
  SpreadsheetApp.flush();

*/
  Logger.log("Utils.copySheet function: Copying from: "+sourceSheet.getName());
  saveSheetValues(sourceSheet.getDataRange().getValues(),destSheet,step)
}

/******************************************************/
function saveSheetObjs(headers,rows,destSheet,step,appendToEnd)
{

  if (!rows || rows.length<1) return;
  var values=[headers];
  if (appendToEnd)
    values=[]; //no headers if adding at the end
  for(var i=0;i<rows.length;i++)
  {


    var row=rows[i];
    var insertRow=[];
    for(var j=0;j<headers.length;j++)
    {
      insertRow.push(row[headers[j]]);
    }
    values.push(insertRow);
  }
  saveSheetValues(values,destSheet,step,appendToEnd);
}
/******************************************************/

function saveSheetValues(values,destSheet,step,appendToEnd)
{
  var startingRow=1;
  if (appendToEnd)
    startingRow=1+destSheet.getLastRow();
  else
    destSheet.clear();

  Logger.log("Utils.saveSheetValues function: Copying to "+destSheet.getName());
  var chunk=step?step:1000;

  var position,totalLength,temparray;
  for (position=0,totalLength=values.length; position<totalLength; position+=chunk)
  {
    temparray = values.slice(position,position+chunk);
    destSheet.getRange(startingRow+position,1,temparray.length,values[0].length).setValues(temparray);
    SpreadsheetApp.flush();
  }
  Logger.log("Utils.saveSheetValues function: End copy");

}

/******************************************************/
function toUpperCase(str) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < str.length; ++i) {
    var letter = str[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}


// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}

/**************************************************/
function copyFormat(origRange, destRange)
{
  destRange.setBackground(origRange.getBackground()) ;
  destRange.setFontStyle(origRange.getFontStyle()) ;
  destRange.setFontWeight(origRange.getFontWeight()) ;
}

/**************************************************/
function stripHashTag(string)
{
  if( string != undefined )
    return string.split("#").join("");

  return string;
}

function testStripHashTag()
{
  Logger.log(stripHashTag("1234"));
  Logger.log(stripHashTag("##1234"));
}
/**************************************************/
function toUpper(str){
  var result = str;
  if (str){
    result = str.toLocaleUpperCase().trim();
  }
  return result;
}
/**************************************************/
function toLower(str){
  var result = str;
  if (str){
    result = str.toLowerCase().trim();
  }
  return result;
}
/**************************************************/
function quitSpaces(str){
  var result = str;
  if (str && str.indexOf(" ") >= 0){
    result = str.replace(" ","");
  }
  return result;
}
/**************************************************/


/**************************************************/
function Cache() {
  this._cache = {},
  this._hashFunction,

  this.init = function(theList, hashFunction) {

      if( theList == undefined || hashFunction == undefined )
        return false;

    this._cache = {};
    this._hashFunction = hashFunction;

    this._reload(theList);
  }

  this._reload = function(theList) {
      for( key in theList ) {
        var element = theList[key];
        var hashKey = this._hashFunction(element);

        if( this._cache[hashKey] == undefined ) {
          this._cache[hashKey] = new Array();
        }

        this._cache[hashKey].push(element);
      }
  }

  this.get = function(element) {
    var hashKey = this._hashFunction(element);
    var elementFound = undefined;

    var cachedValues = this._cache[hashKey];

    if( cachedValues != undefined ) {
      elementFound = cachedValues[0];
    }

    return elementFound;
  }

  this.getAll = function(element) {
    var hashKey = this._hashFunction(element);
    var elementFound = undefined;

    var cachedValues = this._cache[hashKey];

    if( cachedValues != undefined ) {
      if( cachedValues.length > 1 ) {
        elementFound = cachedValues;
      }
      else {
        elementFound = cachedValues[0];
      }
    }

    return elementFound;
  }
}

/**************************************************/
function addDaysToDate(daysToAdd,date)
{
  var ret = new Date(date||new Date());
  ret.setDate(ret.getDate() + daysToAdd);
  return ret;
}

/**************************************************/
function findWeekday(weekday,date)
{
  weekday=weekday%7;
  var ret = new Date(date||new Date());
  var daysToAdd=(weekday - 1 - ret.getDay() + 7) % 7 + 1;
  if (daysToAdd>0 && daysToAdd<7)
    ret.setDate(ret.getDate() + daysToAdd);
  return ret;
}
/**************************************************/
/**************************************************/
function getDateWeek(date_)
{
  var date = new Date(date_);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}
/************************************************************/
function normalizeDate(currentDate)
{
  if (!currentDate) return;
  var result= currentDate.getFullYear()+ String("0" + (currentDate.getMonth()+1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
  //Logger.log(result + ":"+currentDate);
  return result;
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
/**************************************************/
/**************************************************/
function hasElapsedEnoughTime(processName,millisBetweenLastTime)
{
  processName="hasElapsedEnoughTime__"+processName;
  var lastTime = PropertiesService.getUserProperties().getProperty(processName);
  if (!lastTime )
    lastTime=0;

  var currentTime=new Date().getTime();
  if (currentTime-lastTime<millisBetweenLastTime)
    return false;
  PropertiesService.getUserProperties().setProperty(processName,currentTime);
  return true;
}
function testhasElapsedEnoughTime()
{
  for (var i=0;i<5;i++)
  {
    Logger.log(i);
    while(!hasElapsedEnoughTime("testhasElapsedEnoughTime",1000*3))
    {
      Utilities.sleep(500)
    }
  }
    Logger.log("end");
}
/**************************************************/
/**************************************************/
/*
TO DO: escape strings!
*/
function sendTableEmailFromObjs (subject,emailRecipients, values, headers,severalTables,titles)
{
  if (!severalTables)
  {
    values=[values];
    headers=[headers];
  }

  var htmlTable="<body><center><h2>"+subject+"</h2><br />\r\n";
  for(var i=0;i<values.length;i++)
  {
    if (i>0)
      htmlTable+="<hr>";
    if (titles)
      htmlTable+="<h2>"+titles[i]+"</h2>";
    htmlTable+=convertArrayToHTML(values[i], headers[i])

  }
  htmlTable+="\r\n</center></body>\r\n";

  GmailApp.sendEmail(emailRecipients,subject,"This is an HTML email",{htmlBody: htmlTable});
}

/**************************************************/
/**************************************************/
function convertArrayToHTML (values, headers)
{
  var htmlTable="<table border=1><tr>";

  for(var j=0;j<headers.length;j++)
  {
    htmlTable+="<td>"+headers[j]+"</td>";
  }

  htmlTable+="</tr>\r\n";

  for(var i=0;i<values.length;i++)
  {
    if (values[i].htmlRowBGColor)
      htmlTable+="<tr style='background-color: "+values[i].htmlRowBGColor+";'>";
    else
      htmlTable+="<tr>";
    for(var j=0;j<headers.length;j++)
    {
      htmlTable+="<td>"+values[i][headers[j]]+"</td>";
    }
    htmlTable+="</tr>\r\n";
  }
  htmlTable+="</table>";


  return htmlTable;
}








// source tab Library_CCPOFileFinder.gs
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








// source tab Module_syncPublicBenchFile.gs


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









// source tab Module_ImportFromEmail.gs
function importFromEmail_cron()
{
Logger.log("importFromEmail_cron");

  var importer=new ImporterClass_();
  Logger.log("importFromEmail");
  importer.importFromEmail();
Logger.log("END importFromEmail_cron");
}

////////////////////////////////////////
////////////////////////////////////////
function ImporterClass_ ()
{
  var logger=new CCPOLoggerClass("ImporterClass");


  this.importFromEmail =function ()
  {
    Logger.log("Check projects");
    var modified=this.importProjects();

    Logger.log("Check ticketsGlow");
    if (!modified)
      modified=this.importTicketsGlow();


    //Esto de abajo deberia ser reemplazado por el TicketsGlow
    /******
    Logger.log("Check tickets");
    if (!modified)
      modified=this.importTickets();
    *******/

    /* Removed 9/april/2014
    Logger.log("Check releases");
    if (!modified)
    modified=this.importReleases();
    */

    Logger.log("Check birthdays");
    if (!modified)
      modified=this.importBirthdayGlobers();
    Logger.log("Check globers");

    if (!modified)
      modified=this.importGlobers();


    Logger.log("Check ReleasesAllActualAndFuture");

    if (!modified)
      modified=this.importReleasesAllActualAndFuture();


    Logger.log("Check GloberSkills");

    if (!modified)
      modified=this.importGloberSkills();

    Logger.log("Check OUs");
    if (!modified)
      modified=this.importOUs();

    Logger.log("Check Weekly Hours");
    if (!modified)
      modified=this.weeklyHours();
  }


  ////////////////////////////////////////
  this.importReleasesAllActualAndFuture =function ()
  {
    var destSpreadsheet=getGlowImport2Spreadsheet();
    var modified=importFromEmail(destSpreadsheet,"AssignmentReportEndingFrom8DaysAgo", "ReleasesActualAndFuture", "AssignmentReportEndingFrom8DaysAgo.csv", true);
    if (modified)
    {
      //Sync Releases to all sheets
      logger.log("sync ReleasesActualAndFuture");
      var sourceSheet=destSpreadsheet.getSheetByName("ReleasesActualAndFuture");
      var destSheet = getReleasesSheet() ;
    }
    return modified;
  }

  ////////////////////////////////////////
  this.importReleases =function ()
  {
    var destSpreadsheet=getGlowImport2Spreadsheet();
    var modified=importFromEmail(destSpreadsheet,"AssignmentsReport", "Releases", "AssignmentsReport.csv", true);
    if (modified)
    {
    }
    return modified;
  }


  ////////////////////////////////////////
  this.importGloberSkills =function ()
  {
    var modified=importFromEmail(getGloberSkillsSpreadsheet(),"Globers Skills", "GloberSkills", "AllGlobersSkills.csv",true);
    if (modified)
    {

    }
    return modified;
  }

  ////////////////////////////////////////
  this.weeklyHours =function ()
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"Reporte de horas semanales", "WeeklyHours", "weeklyHours.csv",true);
    if (modified)
    {

    }
    return modified;
  }

  ////////////////////////////////////////
  this.importOUs =function ()
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"Organizational Units Report", "OrgUnits", "ouReport.csv",true);
    if (modified)
    {

    }
    return modified;
  }

  ////////////////////////////////////////
  this.importBirthdayGlobers =function ()
  {
    var modified=importFromEmail(getGlowImportSpreadsheet(),"Report: Birthday Globers", "BirthdayGlobers", "BirthdayGlobers.csv");
    if (modified)
    {

    }
    return modified;
  }

  ////////////////////////////////////////
  /*
  this.importTickets =function ()
  {
    var modified=importFromEmail(getGlowImportSpreadsheet(),"Sincronizacion Tickets-Planilla", "TicketsTS-Automatic", "SincronizacionTickets-Planilla.csv", true);
    if (modified)
    {

    }
    return modified;
  }
  */

  ////////////////////////////////////////
  this.importTicketsGlow =function ()
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"TicketsGlow", "TicketsGlow", "TicketsGlow.csv", true);
    if (modified)
    {
      var computation=new CCPOTicketsProcessingClass();
      computation.syncTicketsWithGlow("dario.robak@globant.com,nicolas.gerpe@globant.com");
    }
    return modified;
  }


  ////////////////////////////////////////
  this.importProjects =function ()
  {
    var destSpreadsheet=getGlowImportSpreadsheet();
    var modified=importFromEmail(destSpreadsheet,"Report: projects", "Projects", "AllProjectsWithPMsAndPgMs.csv", true);
    if (modified)
    {
      //Sync Projects to all sheets
      logger.log("sync projects");
      var sourceSheet=destSpreadsheet.getSheetByName("Projects");
      var destSheet = getBenchSpreadsheet().getSheetByName("Projects");
      copySheet(sourceSheet,destSheet);

      destSheet = getPublicProjectSheet();
      copySheet(sourceSheet,destSheet);

      //destSheet = getReleasesProjectsSheet();
      //copySheet(sourceSheet,destSheet);

      //destSheet = getProjectDispersionSpreadsheet().getSheetByName("Projects");;
      //copySheet(sourceSheet,destSheet);
    }
    return modified;
  }



  ////////////////////////////////////////
  this.importGlobers =function ()
  {
    var destSpreadsheet=getGlowImportSpreadsheet();
    var modified=importFromEmail(destSpreadsheet,"Report: globers", "Globers", "ProductionsGlobers.csv", true);
    if (modified)
    {

      //Sync Globers to all sheets
      logger.log("sync Globers to bench file");
      var sourceSheet=destSpreadsheet.getSheetByName("Globers");
      var destSheet = getBenchSpreadsheet().getSheetByName("Globers");
      copySheet(sourceSheet,destSheet);

      //logger.log("sync Globers to dispersion");
      //destSheet = getProjectDispersionSpreadsheet().getSheetByName("Globers");
      //copySheet(sourceSheet,destSheet);
      //END Sync Globers to all sheets
    }
    return modified;
  }

  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////

  function importFromEmail(destSpreadsheet,subject, sheetName, attachmentName, runOptimized)
  {
    var imported=false;

    var threads = GmailApp.search('subject:"'+subject+'" has:attachment in:inbox', 0, 1);
    if (threads.length==0)
    {
      Logger.log("No Emails");
      return false;
    }
    Logger.log("Emails:"+threads.length);
    var label = GmailApp.getUserLabelByName("processed");
    var destSheet = destSpreadsheet.getSheetByName(sheetName);
    assert(destSheet,"importFromEmail: Sheet "+sheetName+" not found")


    for (var x=0; x<threads.length; x++)
    {
      var messages = threads[x].getMessages();
      Logger.log(threads[x].getFirstMessageSubject());
      for (var y=0; y<messages.length; y++)
      {
        var attachments = messages[y].getAttachments();
        for (var z=0; z<attachments.length; z++)
        {
          var file = attachments[z];
          if (file.getName()!=attachmentName)
            continue;

          logger.log("importing file:"+file.getName() );
          var strData=file.getDataAsString();


          if (runOptimized)
          {
            logger.log("Running optimized");
            var utilities = new CSVUtilitiesClass(",", "\r\n");
            utilities.importCsvToSheet(destSheet, strData);
          }
          else
          {
            var values=CSVToArray(strData);

            //Logger.log(values[0].length);
            //Logger.log(values[values.length-1]);
            //Logger.log(values[1]);

            // REMOVE TRAILING RECORDS
            while (values.length>0 && (values[values.length-1].length<values[0].length))
            values=values.slice(0,values.length-1);
            if (values.length==0) continue;
            // end REMOVE TRAILING RECORDS

            destSheet.clear();
            destSheet.getRange(1,1,values.length,values[0].length).setValues(values);

          }
          imported=true;
        }
      }

      if (imported)
      {
        threads[x].markRead();
        //threads[x].addLabel(label);
        //threads[x].moveToArchive();
        threads[x].moveToTrash(); //will be kept 30 days and then removed by gmail itself
      }
    }
    return imported;
  }


}


///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
/* Use with Care!!!


function testDeleteOldMail_()
{
   deleteOldMail_("processed", 5);

}

function deleteOldMail_(labelName, days)
{
  Logger.log("start");
  if (!days) throw ("deleteOldMail: invalid time");

  if (!labelName) throw ("deleteOldMail: invalid label");
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) throw ("deleteOldMail: invalid label"); //check label exists

  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate()-days);

  var filter='label:"'+labelName+'" older_than:'+days+'d';
  Logger.log(filter);
  var threads = GmailApp.search(filter, 0, 5);

  for (var x=0; x<threads.length; x++)
  {
    var messages = threads[x].getMessages();
        Logger.log("Thread:"+threads[x].getFirstMessageSubject()+"/"+threads[x].getLastMessageDate());
    if (threads[x].getLastMessageDate()<maxDate)
      {
        Logger.log("delete!");
        //threads[x].moveToTrash();
      }
  }
    Logger.log("end");

}
*/








// source tab Library_CSVProssesing.gs

// http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.

function CSVToArray( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );


  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;


  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
    ){

      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push( [] );

    }


    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[ 2 ]){

      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
      );

    } else {

      // We found a non-quoted value.
      var strMatchedValue = arrMatches[ 3 ];

    }


    // Now that we have our value string, let's add
    // it to the data array.
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }

  // Return the parsed data.
  return( arrData );
}








// source tab Module_Backup.gs
function backupBenchFile_cron()
{

  var backupFolderId="0BzgUaAY0-dteclRubW5xcXlqV1k"; //Backup folder
  var logger=new CCPOLoggerClass("Backup Module");

  logger.log("About to make bench file backup.");
  backupFile_(getBenchSpreadsheetId(), backupFolderId) ;

  logger.log("About to make THIS script (codebase) backup.");
  backupFile_("1ORAs5Fi26nz3bJXGveJgwEKGZN5VcksfN9YRDqJMn-qPsIePi91YX2DC", backupFolderId) ;

  logger.log("About to make headcount spreadsheet backup.");
  backupFile_("1CvLiQF3DIOMJNIEItMK7FwxUkyKkwy_oaaKdMDJ2r2s", backupFolderId) ;


  logger.log("About to make birthday script (codebase) backup.");
  backupFile_("1EcW6nsfDfAr-SM_FXQG6yVsmXIckB0aFZWqKu7jGdqUXBZxBQd_Lo8vJ", backupFolderId) ;

  logger.log("About to make dashboard tickets backup.");
  backupFile_("0An-jcFMxy8_ydEdvb0kzQkZtNm1hdVM3cDNPVGFaSkE", backupFolderId) ;

  logger.log("About to make dashboard rec& sites backup.");
  backupFile_("0An-jcFMxy8_ydGhzWl8wc1RsU0V4MmE2SzNXM3NZQ3c", backupFolderId) ;

  logger.log("About to make Suggestion Module backup.");
  backupFile_("1U2XW6sLeuGh0IKb_cfRIJAYpKFWb88NiaZve8IVInp6pF2ucInx_Ww3a", backupFolderId) ;
  backupFile_("0AiPaPAJepRvRdEdyWGc1UHhSd1pKeXZnNlcyMmxtZXc", backupFolderId) ;

  // Backup Open Positions files
  backupFile_("0AiPaPAJepRvRdDhOYmhJNk9lbWhjOW9SYS0wV0ZaY0E", backupFolderId) ;
  backupFile_("1NSA-_FzzvIiiA2qA-Bgcjkh8ua0grO4l-ITLJZrb--C-c6HVstnGYcWq", backupFolderId) ;

  logger.log("About to make LOGS backup.");
//  backupFile_("0AqajL6lY_OQndG53ZGRxWHBoQU1nRzFENjJNOXM2Y2c", backupFolderId) ;

  try{
  cleanBackupFiles_(20,backupFolderId);
  }
  catch(e)
  {
    throw "Cannot clean backup files";
  }

  logger.log("End bench file backup.");
}


///////////////////////////////////////////////////////////////
function backupFile_(sourceFileId, backupFolderId)
{
  var file = DriveApp.getFileById(sourceFileId);
  var folder = DriveApp.getFolderById(backupFolderId);
  var currentDate = new Date();
  var backupFileNameFormat = currentDate.getFullYear()
                      + String("0" + (currentDate.getMonth()+1)).slice(-2)
                      + String("0" + currentDate.getDate()).slice(-2)
                      + "_"
                      + String("0" + currentDate.getHours()).slice(-2)
                      + String("0" + currentDate.getMinutes()).slice(-2)
                      + String("0" + currentDate.getSeconds()).slice(-2)
                      + "_"
                      + file.getName();

  Logger.log("Back-up: "+backupFileNameFormat);
  var backup = file.makeCopy(backupFileNameFormat,folder);
/*
  folder.addFile(backup);
  DriveApp.removeFile(backup);
*/
}

///////////////////////////////////////////////////////////////
function cleanBackupFiles_(numDaysToKeep, backupFolderId)
{
  var backupfolder = DriveApp.getFolderById(backupFolderId);

  //A date in the past (hopefully) that marks the lower limit of backups to keep until today.
  var pruneUntilDate = new Date();
  pruneUntilDate.setDate(pruneUntilDate.getDate() - numDaysToKeep)
  Logger.log("Keeping all the files starting from: " + pruneUntilDate + " until today!");

  var filesWerePruned = 0;
  var fileIterator = backupfolder.getFiles();
  while(fileIterator.hasNext())
  {
    var file = fileIterator.next();

    //Take the pattern of the file's name and extract the date at the beginning.
    var fileNameSplitted = file.getName().replace(/(\d\d\d\d)(\d\d)(\d\d)_(\d\d)(\d\d)(\d\d)_(.*)/, "$1-$2-$3-$4-$5-$6-$7").split("-");
    var backupDate = new Date(fileNameSplitted[0], fileNameSplitted[1]-1, fileNameSplitted[2], fileNameSplitted[3], fileNameSplitted[4], fileNameSplitted[5], 0);

    //If the file falls below the range prune it!
    if(pruneUntilDate.getTime() > backupDate.getTime()) {
      Logger.log("This file is no longer needed and will be deleted: " + file.getName());
      file.setTrashed(true);

      filesWerePruned++;
    }
  }

  return filesWerePruned;
}








// source tab Library_Logs.gs
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










// source tab Library_CSVProcessingFast.gs
/**
* Defines the class CSVUtilitiesClass.
*
//* @param {strColumnDelimiter} The column delimiter.
* @param {strRowDelimiter} The row delimiter.
*/
function CSVUtilitiesClass(strColumnDelimiter, strRowDelimiter) {
  var strColumnDelimiter = (strColumnDelimiter || "," );
  var strRowDelimiter = (strRowDelimiter || "\n");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strColumnDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strColumnDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );
  //Logger.log(objPattern);
  //Private Functions

  /**
  * Splits into chunks the array and calls the callback for each chunk.
  *
  * @param {array} The array to be chunked.
  * @param {chunkSize} The chunk size.
  * @param {iteratorCallBack} The function to call for each chunk of data.
  */
  function chunk (array, chunkSize, iteratorCallBack) {
    var rowsGroup = Math.ceil(array.length / chunkSize);

    for(var groupIndex = 0; groupIndex < rowsGroup; groupIndex++) {
      var startingIndex = groupIndex*chunkSize;
      var arraySlice = array.slice(startingIndex, startingIndex + chunkSize);
      iteratorCallBack(arraySlice, startingIndex, startingIndex + chunkSize,chunkSize);
    }
  }

  /**
  * Converts a Csv into an array for big files.
  *
  * @param {strData} The string with the csv definition.
  */
  function optimizedCsvToArray(strData){
    var lines = strData.split(strRowDelimiter);
    var arrData = [];

    if(lines.length > 0){
      var columnLength = lines[0].split(strColumnDelimiter).length;

      for (var i = 0; i < lines.length ; i++){
        var originalLine = lines[i];
        var splittedLine = lines[i].split(strColumnDelimiter);

        if(splittedLine.length != columnLength) {
          if(originalLine.length > 0) {
            //Logger.log("using slow csvToArray:"+originalLine);

            lines[i] = csvToArray(originalLine)[0];
          }
          else {
            lines[i] = [];
          }

          if(lines[i].length < columnLength)
          {
            lines[i].push("");
          }
        }
        else {
          lines[i] = splittedLine;
        }
      }

      arrData = lines;
    }

    // Return the parsed data.
    return( arrData );
  }

  /**
  * Converts a Csv into an array, it is very flexible but also a bit slow.
  *
  * @param {strData} The string with the csv definition.
  */
  function csvToArray(strData){
    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

      // Get the delimiter that was found.
      var strMatchedDelimiter = arrMatches[ 1 ];

      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (
        strMatchedDelimiter.length &&
        (strMatchedDelimiter != strColumnDelimiter)
        ){

          // Since we have reached a new row of data,
          // add an empty row to our data array.
          //Logger.log(arrData[arrData.length-1]);
          arrData.push( [] );
        }


      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we
      // captured (quoted or unquoted).
      if (arrMatches[ 2 ]){

        // We found a quoted value. When we capture
        // this value, unescape any double quotes.
        var strMatchedValue = arrMatches[ 2 ].replace(
          new RegExp( "\"\"", "g" ),
          "\""
        );

      } else {

        // We found a non-quoted value.
        var strMatchedValue = arrMatches[ 3 ];

      }

      // Now that we have our value string, let's add
      // it to the data array.
      arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
  }

  //Public Functions

  /**
  * Imports the data from a Csv string into the specified sheet.
  *
  * @param {sheet} The sheet within a spreadsheet into which the data will be copied.
  * @param {csvString} A string with the Csv.
  */
  this.importCsvToSheet = function(sheet, csvString){

    assert(sheet,"importCsvToSheet: sheet is null");

    var values = optimizedCsvToArray(csvString);

    /* REMOVE TRAILING RECORDS */
    while (values.length>0 && (values[values.length-1].length<values[0].length))
    values=values.slice(0,values.length-1);

    /* end REMOVE TRAILING RECORDS */

    sheet.clear();
    SpreadsheetApp.flush();

    chunk(values, 500, function (arraySlice, startingIndex, endIndex, chunkSize){
      var dataRange = sheet.getRange(1+startingIndex,1,arraySlice.length,arraySlice[0].length);

      for(var i = 0; i < arraySlice.length; i++)
      {
        if(arraySlice[i].length ==1)Logger.log(arraySlice[i]);
      }
      try
      {
        dataRange.setValues(arraySlice);
        SpreadsheetApp.flush();
      }
      catch(err)
      {
        Logger.log(err);
        throw err;
      }

      Logger.log("Rows:" + arraySlice.length + "Columns:" + arraySlice[0].length);
    });
  }
}








// source tab UNUSED_Module_syncDatamining.gs
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








// source tab Module_BestFit.gs

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








// source tab Module_ComputeBenchCost.gs

function computeBenchCost_cron()
{
  var oneHourMillis=1000*60*60.0;

  var computation=new CCPOComputeBenchCostsClass();
  var costs=computation.computeAllCosts();


  if (true)
  {
    computation.saveCosts(costs);

    if (CCPODateUtils.isWorkingDay())
    {

      if (hasElapsedEnoughTime("ComputeBenchCost_informErrors",23*oneHourMillis))
        computation.informErrors("dario.robak@globant.com,nicolas.gerpe@globant.com,emanuel.prebende@globant.com");

      if (hasElapsedEnoughTime("ComputeBenchCost_emailToPartners",2*23*oneHourMillis))
        computation.sendEmailToPartners(costs,"techpartners@globant.com, vivian.sauksteliskis@globant.com, gaston.horvat@globant.com");

      if (hasElapsedEnoughTime("ComputeBenchCost_informExpensiveGlobers",2*23*oneHourMillis))
        computation.informExpensiveGlobers("dario.robak@globant.com,analia.altieri@globant.com,bernardo.manzella@globant.com");
    }
  }
  else
  {
    //computation.informErrors("dario.robak@globant.com");
    //computation.informExpensiveGlobers("dario.robak@globant.com");
      computation.sendEmailToPartners(costs,"dario.robak@globant.com");
  }

}



//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeBenchCostsClass ()
{
  var errorList=new Array();
  var expensiveGloberList=new Array();
  var costByEmailMap=getCostsByEmailMap();

  function addError(errorMsg)
  {
    errorList.push(errorMsg);
    Logger.log(errorMsg);
  }

  /************************************************************/
  function getCostsByEmailMap()
  {
    var costsSheet =getSalariesSheet();

    var costsRows = getRows(costsSheet);

    var map={};
    for(var i=0;i<costsRows.length;i++)
    {
      var costRow=costsRows[i];
      var cost=costRow["CE USD+OS"];

      if (!isNumber(cost))
      {
        addError("Cost Error: "+costRow["Mail"]+":"+cost);
        continue;
      }
      map[costRow["Mail"]]=cost;
    }
    return map;
  }

  function isNumber(n)
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /************************************************************/
  function getCost(globerEmail)
  {

    if (globerEmail in costByEmailMap)
    {
      return costByEmailMap[globerEmail];
    }
    return -1;
  }
  /************************************************************/
  function formatCost(cost)
  {
    //return Math.floor(cost*100)/100;
    return Math.floor(cost);
  }

  /************************************************************/
  function addToProperty(obj,property,value)
  {
    if(!obj[property]) obj[property]=value;
    else obj[property]+=value
  }

  /************************************************************/
  this.computeAllCosts=function ()
  {
    var totalCosts={};
    totalCosts.headCount=0;
    totalCosts.cost=0;
    totalCosts.headCountOnsite=0;
    totalCosts.costOnsite=0;
    totalCosts.headCountOffshore=0;
    totalCosts.costOffshore=0;
    totalCosts.missingCosts=0;
    totalCosts.headCountBr=0;
    totalCosts.costBr=0;

    var benchSheet = getBenchSpreadsheet().getSheetByName("Available");
    var benchRows = getRows(benchSheet);

    for(var i=0;i<benchRows.length;i++)
    {
      var benchRow=benchRows[i];
      var email=benchRow.Email; //TODO: CHECK VALUE!

      var cost=2640; //This is the avg production CE



      if (email!="NH")
      {
        var cost2=getCost(email);
        if (cost2==-1)
        {
//          addError("Can't find glober cost: "+email+"/"+benchRow.Location);
          addError(email);
          if (benchRow.Aging>=0) totalCosts.missingCosts++;
        }
        else
          cost=cost2;
      }

      benchRow.cost=cost; //save the cost in the globers array (I love JS!)

      if (benchRow.Aging<0) continue;

      var percent=benchRow["%"]; //TODO: CHECK VALUE!
      if (percent<1) continue;

      cost=cost*percent/100;


      //Logger.log(email+","+benchRow.Aging+","+percent);

      totalCosts.headCount+=percent;
      totalCosts.cost+=cost;

      addToProperty(totalCosts,"studioheadcount__"+benchRow.Studio,percent);
      addToProperty(totalCosts,"studiocost__"+benchRow.Studio,cost);

      if (benchRow.Location && (benchRow.Location.indexOf("US") == 0 || benchRow.Location.indexOf("EU") == 0))
      {
        totalCosts.headCountOnsite+=percent;
        totalCosts.costOnsite+=cost;
      }
      else
      {
        totalCosts.headCountOffshore+=percent;
        totalCosts.costOffshore+=cost;
        if (benchRow.Location && benchRow.Location.toUpperCase().indexOf("BR") == 0)
        {
          totalCosts.headCountBr+=percent;
          totalCosts.costBr+=cost;
        }
      }


    }


    /** sort based on cost ***/
    benchRows.sort(function(a,b){return b.cost-a.cost});
    for(var i=0;i<benchRows.length;i++)
    {
      var benchRow=benchRows[i];
      //if (benchRow.Aging<-15) continue; //only see 15 days in advance
      if (benchRow.cost<4000) break; //only see expensive people
      expensiveGloberList.push(benchRow);
      Logger.log(formatCost(benchRow.cost)+":"+benchRow.Email + "(" + benchRow.Stage +")");
    }


    Logger.log(totalCosts);
    return totalCosts;
  }


  this.saveCosts=function (costs)
  {
     var spreadsheet=getLogSpreadsheet();
     var sheet= spreadsheet.getSheetByName("DailyBenchCostUSD");

    var values=[new Date(), costs.headCount/100,formatCost(costs.cost),costs.headCountOffshore/100,formatCost(costs.costOffshore),costs.headCountOnsite/100,formatCost(costs.costOnsite),costs.missingCosts,costs.headCountBr/100,formatCost(costs.costBr)];
    sheet.appendRow(values);

    SpreadsheetApp.flush();

  }

  this.sendEmailToPartners=function (costs,emailRecipients)
  {
    var values=[];

    for(var key in costs)
    {
      if (key.indexOf("studioheadcount__")!=0) continue;
      var studio=key.split("__")[1];
      values.push({studio:studio,headcount:costs[key],cost:costs["studiocost__"+studio]});
    }
    values.sort(function Comparator(a,b){if (a.studio < b.studio) return -1;if (a.studio > b.studio) return 1;return 0;});

    var date=normalizeDate(new Date());
    var htmlTable="<body><h2> Bench cost by studio: "+date+"</h2><br /><table border=1><tr><td>Studio</td><td>Headcount</td><td>Cost</td></tr>";
    for(var i=0;i<values.length;i++)
    {
      htmlTable+="<tr><td>"+values[i].studio+"</td><td align=right>"+values[i].headcount/100+"</td><td align=right>"+formatCost(values[i].cost)+"</td></tr>";
    }
    htmlTable+="<tr><td><b>Totals</b></td><td align=right><b>"+costs.headCount/100+"</b></td><td align=right><b>"+formatCost(costs.cost)+"</b></td></tr>";
    htmlTable+="</table>";

    /* Bodnar asked to remove this info
    expensiveGloberList.sort(function(a,b){return b.Aging-a.Aging;});
    htmlTable+="<h2> High priority globers without assignment</h2><br /><table border=1><tr><td>Email</td><td>Aging</td><td>Studio</td><td>Location</td><td>Skill</td><td>Seniority</td></tr>";
    for (var i=0;i<expensiveGloberList.length;i++)
    {
      var txt="<tr><td>"+expensiveGloberList[i].Email +"</td><td align=right>"+
        expensiveGloberList[i].Aging+"</td><td>"+
        expensiveGloberList[i].Studio+"</td><td>"+
        expensiveGloberList[i].Location+"</td><td>"+
          expensiveGloberList[i].Skill+"</td><td>"+expensiveGloberList[i].Seniority;

      htmlTable+=txt+"\r\n";
    }
    htmlTable+="</table>";

    */
    htmlTable+="</body>";

    GmailApp.sendEmail(emailRecipients,"Bench cost by studio: "+date,"This is an HTML email",{htmlBody: htmlTable});
  }

  this.informErrors=function (emailAddress)
  {
    if (errorList.length<1) return; //nothing to report

     //send email to emailAddress
    Logger.log("sending email to:"+emailAddress);

    var emailText="Daily Bench Cost Process\r\nError Report:\r\n";
    emailText=emailText+"# of errors:"+errorList.length+"\r\n";
    emailText=emailText+"--------------\r\n";

    for (var i=0;i<errorList.length;i++)
    {
      emailText=emailText+errorList[i]+"\r\n";
    }
    emailText=emailText+"--------------\r\n";
    MailApp.sendEmail(emailAddress, "Daily Bench Cost Process - Error Report", emailText);

  }


  this.informExpensiveGlobers=function (emailAddress)
  {
     //send email to emailAddress
    Logger.log("sending email to:"+emailAddress);
    expensiveGloberList.sort(function(a,b){return b.Email>a.Email?-1:(b.Email<a.Email?1:0);});

    var emailText="Daily Bench Report\r\High Priority Globers in Bench Report:\r\n";
    emailText=emailText+"# of Globers:"+expensiveGloberList.length+"\r\n";
    emailText=emailText+"--------------\r\nStage 1:\r\n";

    for (var i=0;i<expensiveGloberList.length;i++)
    {
      if (expensiveGloberList[i].Aging<0) continue;
      var txt=expensiveGloberList[i].Email + " /"+expensiveGloberList[i].Location+ "/"+expensiveGloberList[i].Skill+ "/"+expensiveGloberList[i].Seniority+"/("+expensiveGloberList[i]["%"]+"%) ";

      emailText=emailText+txt+"\r\n";
    }
    emailText=emailText+"--------------\r\nStage 2:\r\n";


    for (var i=0;i<expensiveGloberList.length;i++)
    {
      if (expensiveGloberList[i].Aging>=0) continue;
      var txt=expensiveGloberList[i].Email + " (" + expensiveGloberList[i].Stage +")/"+expensiveGloberList[i].Location+ "/"+expensiveGloberList[i].Skill+ "/"+expensiveGloberList[i].Seniority;

      emailText=emailText+txt+"\r\n";
    }
    emailText=emailText+"--------------\r\n";

    MailApp.sendEmail(emailAddress, "High Priority Globers in Bench Report", emailText);

  }

}
//////////////////////////////////////////////////////










// source tab Module_OpenPositions.gs

/***********************************************************************************************/
// References
// 1.- Normalised location process
/***********************************************************************************************/


/*************************************************************************************************/
/* Cron function. This function will be called by a scheduled, it should initialise a            */
/* process object instance and execute it.                                                       */
/*************************************************************************************************/
function OpenPositions_cron()
{
  var logger = new CCPOLoggerClass("OpenPositionProccess", "OpenPositionsLogs");
  logger.log("Start open positions proccess...");

  var process = new OpenPositionProccess();
  process._logger = logger;
  process.run();

  logger.log("Job complete.");
}



/*************************************************************************************************/
function OpenPositionProccess() {
  /***********************************************************************************************/
  /* Private constants ***************************************************************************/
  /***********************************************************************************************/
  this._normaliseLocationProcess = new NormaliseLocationProcess();
  this._HISTORIC_SHEET = getOpenPositionsHistoricSheet();
  this._logger;
  this._clientDescriptionsCache;
  this._positionDescriptionsCache;
  this._availableAntCache;
  this._locationDescriptionsCache;
  this._Months = {"january" : 0, "february" : 1, "march" : 2, "april" : 3, "may": 4, "june" : 5,
                  "july" : 6, "august" : 7, "september" : 8, "october" : 9, "november" : 10, "december" : 11}

  /***********************************************************************************************/
  /* Public methods ******************************************************************************/
  /***********************************************************************************************/

  this.run = function(){
    var listTickets = [],
        listHistoricTickets,
        listTicketsPublished;
    try{
      this._log("/******** PROCCESS START ***********/");

      this._log("/******** Backup Available sheet ***********/");
      this.backUp();

      this._log("/******** Initialise the object maps ***********/");
      this.init();

      this._log("/******** Get open possitions ***********/");
      listTickets = this.getOpenPositions();

      this._log("/******** Print open possitions ***********/");
      this.printResults(listTickets);

      this._log("/******** Get historic tickets ***********/");
      listHistoricTickets = this.getListHistoricTickets(listTickets);

      this._log("/******** Print historic tickets ***********/");
      this.printHistoricTickets(listHistoricTickets);

      this._log("/******** Finished CORRECT ***********/");


      /*
       * Send all applicants to Staff area
       */
  //    this._sendGlobersToStaff();
      /**/

      /*
       * Newsletter. Send all new positions to registered globers.
       */
  //    this._sendPositionsToGlobers();
    }
    catch(ex){
      this._log("/******** Finished INCORRECT ***********/");
      this._log(ex);
      throw ex;
    }


  };

  this.init = function(){
    this._clientDescriptionsCache = this._getMapClientDescriptions();
    this._positionDescriptionsCache = this._getMapPositionDescriptions();
    this._availableAntCache = this._getMapAvailableAntDescriptions();
    this._locationDescriptionsCache = this._getMapLocationDescriptions();
  }

  this.backUp = function(){
    var spreadsheet = getOpenPositionsSpreadsheet();
    var availableAntSheet = getOpenPositionsAvailablePreviousSheet();
    var availableSheet = getOpenPositionsAvailableSheet();

    //Delete Available.previous if exists
    if (availableAntSheet) getOpenPositionsSpreadsheet().deleteSheet(availableAntSheet);
    //Rename Available to Available.previous
    availableSheet.setName("Available.previous");
    //Set Available.previous the active sheet
    spreadsheet.setActiveSheet(availableSheet);
    //Move Available sheet at the end
    spreadsheet.moveActiveSheet(spreadsheet.getNumSheets());
    //Create a new Available sheet
    var newsheet = getOpenPositionsSpreadsheet().insertSheet(0);
    newsheet.setName("Available");
    //Set Available the active sheet
    spreadsheet.setActiveSheet(newsheet);

    //BackUp de headers
    var lastColumn = availableSheet.getLastColumn();
    var headersRange = availableSheet.getRange(1, 1, 1, lastColumn);
    var headers = headersRange.getValues();

    newsheet.getRange(1, 1, 1, lastColumn).setValues(headers);
    headersRange.copyFormatToRange(newsheet, 1, lastColumn, 1, 1);
  };

  this.getOpenPositions = function(){
    var listTickets = [],
        mapTicketsDescriptions,
        mapClientDescriptions,
        mapPositionDescriptions;

    this._log("-Get list tickets");
    listTickets = this.getListTickets();
    this._log("-list tickets count = " + listTickets.length);

    this._log("-Group tickets");
    listTickets = this.groupListTickets(listTickets);

    this._log("-Update tickets values");
    this.updateListTickets(listTickets);
    this._log("-New tickets count = " + listTickets.length);

    return listTickets;
  };

  this.getListTickets = function(){

    var i, ticket, listTickets = [], objectMapped;
    var ticketsSheet = getOpenPositionsTicketsSourceSheet();
    var ticketsValues = getRows(ticketsSheet);

    for (i in ticketsValues){
      if (toUpper(ticketsValues[i]["OpenPosition"]) == "YES"){
        //searching... locationDescription
        objectMapped = this._locationDescriptionsCache.get(ticketsValues[i]);
        var locationDescription = (objectMapped)? objectMapped["Description"]:"";
        //

        ticket = new Ticket();
        ticket.number = ticketsValues[i]["Number"];//stripHashTag
        ticket.client = ticketsValues[i]["Client"];
        ticket.project = ticketsValues[i]["Project"];
        ticket.name = ticketsValues[i]["Name"];
        ticket.skill = ticketsValues[i]["Position"];
        ticket.seniority = ticketsValues[i]["Seniority"];
        ticket.location = locationDescription;
        ticket.openPosition = ticketsValues[i]["OpenPosition"];
        ticket.cluster = ticketsValues[i]["Cluster"];
        ticket.cluster = this._normalizeCluster(ticketsValues[i]["Work Office"]);

        listTickets.push(ticket);

      }
    }
    return listTickets;
  };


  this.updateListTickets = function(listTickets){
    var mapTicketDescriptions = this._availableAntCache,
        mapPositionDescriptions = this._positionDescriptionsCache;

    var i, ticket,catalogPositionDescription,
         positionDescriptionAnt, publish, objectMapped;

    for (i in listTickets){

      ticket = listTickets[i];

      //Obtain the position description of the catalog
      objectMapped = mapPositionDescriptions.get(ticket);
      if (objectMapped)
        catalogPositionDescription = objectMapped["Description"];
      else
        catalogPositionDescription = undefined;

      objectMapped = mapTicketDescriptions.get(ticket);
      if (objectMapped){

        //Obtain the publishFlag  of the "Available.previous"
        publish = objectMapped["Publish online"];

        //Obtain the position description of the "Available.previous"
        positionDescriptionAnt = objectMapped["Position Description"];

      }
      else{
        publish = undefined;
        positionDescriptionAnt = undefined;
      }

      //Update position description
      if(positionDescriptionAnt && positionDescriptionAnt !=""){
        ticket.positionDescription = positionDescriptionAnt;
      }
      else{
        if (catalogPositionDescription) ticket.positionDescription = catalogPositionDescription;
      }

      //Update publish flag
      if (publish) ticket.publish = publish;

    }

  };

  this.groupListTickets = function(listTickets){
    var i, mapTickets = {}, key, ticket, newList = [], properties;

    for (i in listTickets){
      ticket = listTickets[i];
      key = this._getTicketKey(ticket);
      if (!mapTickets[key]){
        mapTickets[key] = [ticket.number, ticket.name, ticket.client, ticket.project,
                           ticket.skill, ticket.seniority, ticket.location, ticket.cluster];
      }
      else{
        mapTickets[key][0] = mapTickets[key][0] + ", " + ticket.number;
      }
    }

    for (i in mapTickets){
      //properties = i.split("@");
      ticket = new Ticket();
      ticket.number = mapTickets[i][0];
      ticket.name = mapTickets[i][1];
      ticket.client = mapTickets[i][2];
      ticket.project = mapTickets[i][3];
      ticket.skill = mapTickets[i][4];
      ticket.seniority = mapTickets[i][5];
      ticket.location = mapTickets[i][6];
      ticket.cluster = mapTickets[i][7];
      newList.push(ticket);
    }
    return newList;
  };


  this.printResults = function(listTickets){

    var availableSheet = getOpenPositionsAvailableSheet();
    var results = [], item = [], ticket,i, j, range;

    for (i in listTickets){
      ticket = listTickets[i];
      item = [ticket.number, ticket.name, ticket.client, ticket.project, ticket.skill, ticket.seniority, ticket.location, ticket.cluster, ticket.positionDescription, ticket.publish];
      results.push(item);
    }

    range = availableSheet.getRange(2, 1, availableSheet.getLastRow(), availableSheet.getLastColumn());
    range.clear();
    if (results.length > 0){
      range = availableSheet.getRange(2, 1, results.length, results[0].length);
      range.setValues(results);
    }

    //Resize column Position Description
    var newColumnNdx = getHeaderIndexes(availableSheet)["Position Description"];
    availableSheet.autoResizeColumn(newColumnNdx);

  };

  this.getListHistoricTickets = function(listTickets){

    var listHistoricTickets = [], listNewOpenPositions = [];

    listHistoricTickets = this._getHistoricTickets();
    this._log("-get tickets in historic sheet,count = " + listHistoricTickets.length);

    this._log("-set first Date in available sheet");
    listNewOpenPositions = this.setFirstDateInAvailableSheet(listTickets, listHistoricTickets);

    this._log("-notify to PMs and Technical leaders: " + listNewOpenPositions.length);
    this.notifyToPmsAndTds(listNewOpenPositions);

    this._log("-set last Date in available sheet");
    this.setLastPublishDate(listTickets, listHistoricTickets)

    this._log("listHistoricTickets count: " + listHistoricTickets.length);
    return listHistoricTickets;
  };

  this.setLastPublishDate =  function(listTickets, listHistoricTickets){
    var i, historicTicket, lastPublishDate, firstPublisDate, toDay = new Date(), count = 0, clientDescriptionOjectMapped, availableAntObjectMapped;
    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      firstPublisDate = historicTicket["firstPublishDate"]
      lastPublishDate = historicTicket["lastPublishDate"];
      if (firstPublisDate && (!lastPublishDate || lastPublishDate == "")){
        if (!this._existsHistoricTicketInListTickets(historicTicket,listTickets)){
          clientDescriptionOjectMapped = this._clientDescriptionsCache.get(historicTicket);
          availableAntObjectMapped = this._availableAntCache.get(historicTicket);
          historicTicket["lastPublishDate"] = toDay;
          historicTicket["clientDescription"] = (clientDescriptionOjectMapped) ? clientDescriptionOjectMapped["Description"]: "";
          historicTicket["positionDescription"] = (availableAntObjectMapped) ? availableAntObjectMapped["Position Description"]: "";
          count++;
        }
      }
    }
    this._log("-tickets with last Date in available, count = " + count);
  }

  this.notifyToPmsAndTds = function(newOpenPositions){
    var i, listResults = [], ticket;
    for (i in newOpenPositions){
      ticket = newOpenPositions[i];
      listResults.push(
          [
            ticket.number,
            ticket.name,
            ticket.client,
            ticket.project,
            ticket.skill,
            ticket.seniority,
            ticket.location,
            ticket.clientDescription,
            ticket.positionDescription,
            ticket.publish,
            ticket.cluster
          ]);
    }
    this._notifyToPMTD(listResults);
  }

  this.setFirstDateInAvailableSheet = function(listTickets, listHistoricTickets){
    var i, ticket, historicTicket, toDay = new Date(), listNewOpenPositions = [];
    for (i in listTickets){
      ticket = listTickets[i];
      historicTicket = this._existsTicketInListHistoricTickets(ticket,listHistoricTickets);
      if (!historicTicket){

        var newHistoricTicket = new HistoricTicket();
        newHistoricTicket.number = ticket.number;
        newHistoricTicket.name = ticket.name;
        newHistoricTicket.client = ticket.client;
        newHistoricTicket.project = ticket.project;
        newHistoricTicket.position = ticket.skill;
        newHistoricTicket.seniority = ticket.seniority;
        newHistoricTicket.workOffice = ticket.location
        newHistoricTicket.cluster = ticket.cluster;
        newHistoricTicket.firstDateInAvailable = toDay;
        listHistoricTickets.push(newHistoricTicket);
        listNewOpenPositions.push(ticket);

      }
    }
    this._log("-tickets with first Date in available, count = " + listNewOpenPositions.length);
    return listNewOpenPositions;
  }

  this.printHistoricTickets = function(listHistoricTickets){

    var results = [], item = [], historicTicket,i, range;

    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      item = [historicTicket.number, historicTicket.name, historicTicket.client, historicTicket.project, historicTicket.position, historicTicket.seniority, historicTicket.workOffice, historicTicket.cluster, historicTicket.clientDescription, historicTicket.positionDescription, historicTicket.firstDateInAvailable, historicTicket.firstPublishDate, historicTicket.lastPublishDate];
      results.push(item);
    }

    range = this._HISTORIC_SHEET.getRange(2, 1, this._HISTORIC_SHEET.getLastRow(), this._HISTORIC_SHEET.getLastColumn());
    range.clear();
    if (results.length > 0){
      range = this._HISTORIC_SHEET.getRange(2, 1, results.length, results[0].length);
      range.setValues(results);
    }


  };

  /***********************************************************************************************/
  /* Public methods for populate the widget ******************************************************/
  /***********************************************************************************************/
  this.getListHistoricTicketsByYearAndMonth = function(year, month){

    year = parseInt(year);
    month = this._Months[month];

    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, historicTicket, listResults = [], lastPublishDate;

    for (i in historicValues){
      historicTicket = historicValues[i];
      lastPublishDate = historicTicket["Last publish date"];
      if (lastPublishDate){
        var firstPublishDate = historicTicket["First publish date"];
        var ticketYear = firstPublishDate.getFullYear();
        var ticketMonth = firstPublishDate.getMonth();
        if (year == ticketYear && month == ticketMonth){
          listResults.push(
            [
              historicTicket["Number"],
              historicTicket["Name"],
              historicTicket["Client"],
              historicTicket["Project"],
              historicTicket["Position"],
              historicTicket["Seniority"],
              historicTicket["Work Office"],
              historicTicket["Client Description"],
              historicTicket["Position Description"],
              "YES",
              historicTicket["Cluster"]
            ]);
        }
      }
    }

    return listResults;

  }
  this.getListTicketsForPublish = function(){

    var openPositionsSheet = getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(openPositionsSheet);
    var i, listResults=[];
    this.init();
    for (i in openPositionsValues){

      if (toUpper(openPositionsValues[i]["Publish online"]) == "YES"){
        var objectMapped = this._clientDescriptionsCache.get(openPositionsValues[i]);
        var clientDescription = (objectMapped)? objectMapped["Description"] : "";
        listResults.push(
          [
            openPositionsValues[i]["Number"],
            openPositionsValues[i]["Name"],
            openPositionsValues[i]["Client"],
            openPositionsValues[i]["Project"],
            openPositionsValues[i]["Position"],
            openPositionsValues[i]["Seniority"],
            openPositionsValues[i]["Work Office"],
            clientDescription,
            openPositionsValues[i]["Position Description"],
            openPositionsValues[i]["Publish online"],
            openPositionsValues[i]["Cluster"]
          ]);
      }
    }

    return listResults;

  };

  /**************Update descriptions****GET***/
  this.getAllTickets=function(){
    var i;
    var availableSheet=getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(availableSheet);
    this.init();
    for (i in openPositionsValues){
      var objectMapped = this._clientDescriptionsCache.get(openPositionsValues[i]);
      var clientDescription = (objectMapped)? objectMapped["Description"] : "";
      openPositionsValues[i]["Client Description"]=clientDescription;
    }
    return openPositionsValues;
  };
  /**************Update descriptions***SET****/
  this.updateDescription=function(rowTicket){
    var i;
    var availableSheet=getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(availableSheet);

    this.init();
    //******Create map for tickets in available
    var mapObject = new Cache();
    var availableSheet = getOpenPositionsAvailableSheet();
    var ticketsDescriptionValues = getRows(availableSheet);
    mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
    //************************************************

    //for (i in openPositionsValues){
        var ticket = mapObject.get(rowTicket);
      Logger.log(ticket);
        //var objectMapped = this._clientDescriptionsCache.get(ticket);
    //}
  };

  /**************Validate access***Security****/
  this.validateUserAccess = function(userId){
    return false;
  };

  this.getListTicketsPublishedToday = function(){

    this.init();
    //******Create map for tickets in available
    var mapObject = new Cache();
    var availableSheet = getOpenPositionsAvailableSheet();
    var ticketsDescriptionValues = getRows(availableSheet);
    mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
    //************************************************

    //var openPositionsSheet = getOpenPositionsAvailableSheet();
    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, listResults=[], today = new Date();

    today.setHours(00,00,00,00);

    for (i in historicValues){

      var publishedDay = historicValues[i]["First publish date"];
      var lastPublishedDay = historicValues[i]["Last publish date"];
      if(publishedDay && publishedDay != "" && !lastPublishedDay ){

        publishedDay.setHours(00,00,00,00);
        if(!(publishedDay - today)){
          //If the dates are equals then insert into the list of results
          var ticket = mapObject.get(historicValues[i]);
          var objectMapped = this._clientDescriptionsCache.get(ticket);
          var clientDescription = (objectMapped)? objectMapped["Description"] : "";
          if (toUpper(ticket["Publish online"]) == "YES"){
            listResults.push(
            [
              ticket["Number"],
              ticket["Name"],
              ticket["Client"],
              ticket["Project"],
              ticket["Position"],
              ticket["Seniority"],
              ticket["Work Office"],
              clientDescription,
              ticket["Position Description"],
              ticket["Publish online"],
              ticket["Cluster"]
            ]);
          }

        }
      }

    }

    return listResults;

  };

  /***********************************************************************************************/
  /* Private methods *****************************************************************************/
  /***********************************************************************************************/
  this._notifyToPMTD = function (listPositions) {
    //var logger = new CCPOLoggerClass("Module_Notify_OP", "OpenPositionsLogs");
    var ssProjects = getOpenPositionsProjectsSourceSheet();
    var ssRows = getRows(ssProjects);
    var i, idList, eMail, cntOK = 0;
    var tmpMails = "";
    this._log("Benche length = " + ssRows.length);
    this._log("listPositions length = " + listPositions.length);

    if ( (listPositions!=null && listPositions.length>0) &&
        (ssRows!=null && ssRows.length>0) ) {
      for (i in listPositions) {
        idList = this._searchSpecificProject(ssRows, "Project", listPositions[i][3]);
        if (idList!=null) {
          listPositions[i][12] = this._isNull(ssRows[idList]["Current Program Managers"]);
          listPositions[i][13] = this._delHyphen(this._isNull(ssRows[idList]["Current Program Managers Emails"]));
          listPositions[i][14] = this._isNull(ssRows[idList]["Current Project Managers"]);
          listPositions[i][15] = this._delHyphen(this._isNull(ssRows[idList]["Current Project Managers Emails"]));
          listPositions[i][16] = this._isNull(ssRows[idList]["Current Technical Leaders"]);
          listPositions[i][17] = this._delHyphen(this._isNull(ssRows[idList]["Current Technical Leaders Email"]));
          listPositions[i][18] = this._isNull(ssRows[idList]["Current Technical Director"]);
          listPositions[i][19] = this._delHyphen(this._isNull(ssRows[idList]["Current Technical DirectorEmail"]));
          // Send email
          eMail = this._getValidEmail(listPositions[i]);
          if ( eMail!="" ) {
            tmpMails += i + ":" + eMail + " *** ";
            eMail = "nicolas.gerpe@globant.com";
            this._sendMail(eMail, 'Update Descriptions of Open Positions', this._getBodyDescriptions(listPositions[i]));
            //MailApp.sendEmail(eMail, 'Update Descriptions of Open Positions', '', {htmlBody : this._getBodyDescriptions(listPositions[i]), name: "pmo-staffing@globant.com", replyTo: "pmo-staffing@globant.com"});
            cntOK += 1;
          } else {
            this._log("El PM y el TD del ticket " + listPositions[i][0] + " (rowProjects="+idList+"+2rows) no cuentan con correo electronico.");
          }
        }
      }
    }

    this._log("Total de Correos Enviados = " + cntOK);
  }

  this._searchSpecificProject = function(rowsSpreadSheet, columnName, value) {
    var i, tmp, listResults=[];
    value = value==null?"":value.trim().toLowerCase();
    for (i in rowsSpreadSheet) {
      tmp = rowsSpreadSheet[i][columnName]==null?"":rowsSpreadSheet[i][columnName].trim().toLowerCase();
      if (tmp == value) {
        return i;
      }
    }
    return null;
  }

  this._sendGlobersToStaff = function() {
    this._log("Start sendGlobersToStaff !!");
    var isRequiredAllGlobers = false;
    var listGlobers = this._appliedOPForGlobers();
    var staffingAreaEmails = this._getStaffingAreaEmails();

    if ( listGlobers!=null && (listGlobers.length>0) &&
      (staffingAreaEmails!=null) && (staffingAreaEmails!="") ) {
      var body = this._getBodyGlobers(listGlobers);
      for (i in staffingAreaEmails) {
        this._sendMail(staffingAreaEmails[i], "New globers applied to an open position", body);
      }
    }

    this._log("Finish sendGlobersToStaff !!");
  }

  this._sendPositionsToGlobers = function () {
    this._log("Start sendPositionsToGlobers !!");

    var i, cntMails=0, isRequiredAllGlobers = true;
    var process = new OpenPositionProccess();
    var listPositions = process.getListTicketsPublishedToday();
    var listGlobers = this._globersRegistered(isRequiredAllGlobers);

    if ( (listPositions!=null && (listPositions.length>0)) &&
      (listGlobers!=null && (listGlobers.length>0)) ) {
        var body = this._getBodyPositions(listPositions);
        for (i in listGlobers) {
          this._sendMail(listGlobers[i].user, "New Open Position!", body);
          cntMails += 1;
        }
      }

    this._log("Se enviaron " + cntMails + " correos");
    this._log("Finish sendPositionsToGlobers !!");
  }

  this._getStaffingAreaEmails = function() {
    var i, tmp;
    var spStaffingArea = getOpenPositionsStaffingAreaSheet();
    var staffingAreaValues = getRows(spStaffingArea);
    var emails = new Array();

    for (i in staffingAreaValues) {
      tmp = staffingAreaValues[i]["ID"].trim();
      if ( tmp!=null && tmp!="" ) {
        emails.push(tmp);
      }
    }

    return emails;
  }

  this._globersRegistered = function(isRequiredAllGlobers) {
    var spreadsheetGlobers = getOpenPositionsPositionsGlobersSheet();
    var globersValues = getRows(spreadsheetGlobers);
    var i, listResults=[], glober;
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);

    for (i in globersValues) {
      if ( isRequiredAllGlobers || (!isRequiredAllGlobers && (lastDay.valueOf() <= (new Date(globersValues[i]["Create Date"])).valueOf())) ) {
        glober = new Glober();
        glober.rowID = globersValues[i]["rowID"];
        glober.user = globersValues[i]["User Name"];
        glober.createDate = new Date(globersValues[i]["Create Date"]);
        listResults.push(glober);
      }
    }

    return listResults;
  }

  this._appliedOPForGlobers = function() {
    var ssApplyOPOffshore = getOpenPositionsPositionsApplyOPOffshoreSheet();
    var ssApplyOPOffshoreValues = getRows(ssApplyOPOffshore);
    var ssApplyOPOnsite = getOpenPositionsPositionsApplyOPOnsiteSheet();
    var ssApplyOPOnsiteValues = getRows(ssApplyOPOnsite);
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);
    var listResults=[];

    ssApplyOPOffshoreValues.sort(function(a , b){
      if (a["Ticket Number"] > b["Ticket Number"])
        return 1;
      if (a["Ticket Number"] < b["Ticket Number"])
        return -1
        if (a["Ticket Number"] == b["Ticket Number"])
          return 0;
    });
    ssApplyOPOnsiteValues.sort(function(a , b){
      if (a["TicketNumber"] > b["TicketNumber"])
        return 1;
      if (a["TicketNumber"] < b["TicketNumber"])
        return -1
        if (a["TicketNumber"] == b["TicketNumber"])
          return 0;
    });

    var lastOffshore = this._getLastOffONOP(ssApplyOPOffshoreValues);
    var lastOnsite = this._getLastOffONOP(ssApplyOPOnsiteValues);

    var tmp = [], g = [];
    for (var i=0; i<lastOffshore.length; i++) {
      if ( i>0 ) {
        if ( lastOffshore[i]["Ticket Number"] != lastOffshore[i-1]["Ticket Number"]) {
          tmp.push(lastOffshore[i-1]["Ticket Number"]);
          tmp.push(lastOffshore[i-1]["Client"]);
          tmp.push(lastOffshore[i-1]["Complete Name"]);
          tmp.push(g);
          listResults.push(tmp);
          g = [];
          tmp = [];
        }
      }
      g.push(lastOffshore[i]["Username"]);
      if ( i == lastOffshore.length-1 ) {
        tmp.push(lastOffshore[i]["Ticket Number"]);
        tmp.push(lastOffshore[i]["Client"]);
        tmp.push(lastOffshore[i]["Complete Name"]);
        tmp.push(g);
        listResults.push(tmp);
        g = [];
        tmp = [];
      }
    }

    tmp = [], g = [];
    for (var i=0; i<lastOnsite.length; i++) {
      if ( i>0 ) {
        if ( lastOnsite[i]["TicketNumber"] != lastOnsite[i-1]["TicketNumber"]) {
          tmp.push(lastOnsite[i-1]["TicketNumber"]);
          tmp.push(lastOnsite[i-1]["Client"]);
          tmp.push(lastOnsite[i-1]["Complete Name"]);
          tmp.push(g);
          listResults.push(tmp);
          g = [];
          tmp = [];
        }
      }
      g.push(lastOnsite[i]["Username"]);
      if ( i == lastOnsite.length-1 ) {
        tmp.push(lastOnsite[i]["TicketNumber"]);
        tmp.push(lastOnsite[i]["Client"]);
        tmp.push(lastOnsite[i]["Complete Name"]);
        tmp.push(g);
        listResults.push(tmp);
        g = [];
        tmp = [];
      }
    }

    return listResults;
  }

  this._getLastOffONOP = function (listOP) {
    var listResult = [];
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);

    for (var i=0; i<listOP.length; i++) {
      if ( lastDay.valueOf() <= (new Date(listOP[i]["Apply Date"])).valueOf() ) {
        listResult.push(listOP[i]);
      }
    }

    return listResult;
  }

  this._getBodyDescriptions = function(openPosition) {
    var body = "";

    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Open Positions for Globers</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";

    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"208\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 5px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\"color: #176bb4; font-size: 18px; font-weight: bold; line-height: 25px\">Update Descriptions </span><br /> <br />";
    body += "<ul>";
    body += "<p align = 'justify'>Position <strong>'" + openPosition[2] + " - " + openPosition[4] + " - " + openPosition[6] + "'</strong> belonging to one of your projects was selected to be published in the <a href='https://sites.google.com/a/globant.com/op/positions'>Open Positions public site</a>.</p>";
    body += "<p align = 'justify'>Please confirm that you want to publish it and please send to pmo-staffing@globant.com a client and position/skill description to make it more appealing for the globers.</p>";
    body += "</ul>";
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";

    return body;
  }

  this._getBodyPositions = function(listPositions) {
    /*******************************************/
    //Refactor list by ofshore and onsite
    var listOnSite = [], listOffShore = [];
    for (var i in listPositions){
      if (listPositions[i][10] == "offshore")
        listOffShore.push(listPositions[i]);
      else if (listPositions[i][10] == "onsite")
        listOnSite.push(listPositions[i]);
    }
    /*******************************************/
    var body = "";

    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Open Positions for Globers</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";

    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"208\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 15px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\" font-size: 16px; font-weight: bold; line-height: 25px\">These new positions were published in the Open Positions’ <a href='https://sites.google.com/a/globant.com/op/positions' target = '_blank'>site</a></span><br /><br />"
    if (listOffShore.length > 0){
      body += "<span style=\"color: #176bb4; font-size: 16px; font-weight: bold; line-height: 25px\">Positions Offshore </span><br />";
      body += "<ul>";
      for (var i = 0; i < listOffShore.length; i++) {
        body += "<li><strong>" + listOffShore[i][2] + " - " + listOffShore[i][4] + " - " + listOffShore[i][6] + "</strong></li>";
      }
      body += "</ul>";
    }
    if (listOnSite.length > 0){
      body += "<span style=\"color: #176bb4; font-size: 16px; font-weight: bold; line-height: 25px\">Positions Onsite </span><br />";
      body += "<ul>";
      for (var i = 0; i < listOnSite.length; i++) {
        body += "<li><strong>" + listOnSite[i][2] + " - " + listOnSite[i][4] + " - " + listOnSite[i][6] + "</strong></li>";
      }
      body += "</ul>";
    }
    body += "<br />";
    body += "To apply for these positions and view the complete list of openings,";
    body += "<a href=\"https://sites.google.com/a/globant.com/op/\" target=\"_blank\">click here</a>. <br />";
    body += "You can unsubscribe any time by unchecking the subscription box in the site<br/><br/>";
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";

    return body;
  }

  this._getBodyGlobers = function(listGlobers) {
    var i, g;
    var body = "";

    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Globers Register</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";

    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"100\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 5px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\"color: #176bb4; font-size: 18px; font-weight: bold; line-height: 25px\">Applied Open Positions </span><br /> <br />";
    body += "<ul>";
    for (var i = 0; i<listGlobers.length; i++) {
      var ticket = listGlobers[i][0];
      var client = listGlobers[i][1];
      var name = listGlobers[i][2];
      var globers = listGlobers[i][3];
      body += "<li> Ticket Number: " + ticket + ", " + client + ", " + name + "</li>";
      for (var j = 0; j<globers.length; j++) {
        body += "<ul>";
        body += "<li>" + globers[j] + "</li>";
        body += "</ul>";
      }
    }
    body += "</ul><br>";
    body += "<p>To check more details on the applicants check the ‘ApplyOPOnsite’ and ‘ApplyOPOffshore’ sheet <a href=\"https://docs.google.com/a/globant.com/spreadsheet/ccc?key=" + getOpenPositionsSpreadsheetId() + "&usp=drive_web#gid=10\">here</a></p>"
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";

    return body;
  }

  this._sendMail = function (to, subject, body) {
    this._log("Sending mail to: " + to);
    GmailApp.sendEmail(to, subject, '', {htmlBody : body, name: "pmo-staffing@globant.com", replyTo: "pmo-staffing@globant.com"});
  }

  this._isNull = function(strValue) {
    return strValue==null?"":strValue.trim();
  }

  this._delHyphen = function(strValue) {
    return strValue.replace(/ - /g, ", ");
  }

  this._getValidEmail = function (openPosition) {
    var eMail = "";
    var previousEmail = false;

    if ( openPosition[15]!="" ) {
      eMail += openPosition[15];
      previousEmail = true;
    }
    if ( openPosition[19]!="" ) {
      if ( previousEmail ) eMail += ",";
      eMail += openPosition[19];
    }

    return eMail;
  }


  this._getMapClientDescriptions = function(){
    var mapObject = new Cache();
    var clientDescriptionSheet = getOpenPositionsClientDescriptionsSheet();
    var clientDescriptionValues = getRows(clientDescriptionSheet);

    mapObject.init(clientDescriptionValues,this._clientDescriptionHashFunction);
    return mapObject;
  };

  this._getMapPositionDescriptions = function(){
    var mapObject = new Cache();
    var positionDescriptionSheet = getOpenPositionsPositionsDescriptionsSheet();
    var positionDescriptionValues = getRows(positionDescriptionSheet);

    mapObject.init(positionDescriptionValues, this._positionDescriptionHashFunction);
    return mapObject;
  };

  this._getMapAvailableAntDescriptions = function(){
   var mapObject = new Cache();
   var availableAntSheet = getOpenPositionsAvailablePreviousSheet();
   var ticketsDescriptionValues = getRows (availableAntSheet);

   mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
   return mapObject;
  };

  this._getMapLocationDescriptions = function(){
    var mapObject = new Cache();
    var locationDescriptionSheet = getOpenPositionsLocationDescriptionsSheet();
    var locationDescriptionValues = getRows(locationDescriptionSheet);

    mapObject.init(locationDescriptionValues, this._locationDescriptionHashFunction);
    return mapObject;
  };

  this._normalizeCluster = function(location){
    var result;
    /*var site = toLower(cluster);
    if (site == "onsite" || site == "offshore"){
      result = site;
    }*/
    if(toUpper(location) === "ANYWHERE"){
      result = "offshore";
    }
    else if (this._normaliseLocationProcess.compatibleLocations("EU", location)){
      result = "onsite";
    }
    else if (this._normaliseLocationProcess.compatibleLocations("UK", location)){
      result = "onsite";
    }
    else{
      result = "offshore"
    }
    return result;
  };

  this._getHistoricTickets = function(){

    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, key, historicTicket, listHistoricTickets=[];

    for (i in historicValues){
      historicTicket = new HistoricTicket();
      historicTicket.number = historicValues[i]["Number"];
      historicTicket.name = historicValues[i]["Name"];
      historicTicket.client = historicValues[i]["Client"];
      historicTicket.project = historicValues[i]["Project"];
      historicTicket.position = historicValues[i]["Position"];
      historicTicket.seniority = historicValues[i]["Seniority"];
      historicTicket.workOffice = historicValues[i]["Work Office"];
      historicTicket.cluster = historicValues[i]["Cluster"];
      historicTicket.clientDescription = historicValues[i]["Client Description"];
      historicTicket.positionDescription = historicValues[i]["Position Description"];
      historicTicket.firstDateInAvailable = historicValues[i]["First date in Available"];
      historicTicket.firstPublishDate = historicValues[i]["First publish date"];
      historicTicket.lastPublishDate = historicValues[i]["Last publish date"];

      key = //historicTicket.name + "@" +
            historicTicket.client + "@" +
            //historicTicket.project + "@" +
            historicTicket.position + "@" +
            historicTicket.seniority + "@" +
            historicTicket.workOffice + "@" +
            historicTicket.cluster;
      historicTicket.key = key;
      listHistoricTickets.push(historicTicket);
    }
    return listHistoricTickets;
  };

  this._getTicketKey = function(ticket){
    var key = null;
    if (ticket){
      key = //ticket.name + "@" +
            ticket.client + "@" +
            //ticket.project + "@" +
            ticket.skill + "@" +
            ticket.seniority + "@" +
            ticket.location + "@" +
            ticket.cluster;
    }
    return key;
  };

  this._clientDescriptionHashFunction = function(element) {
    return toUpper(element["Client"] != undefined ? element["Client"] : element["client"]);
  }

  this._positionDescriptionHashFunction = function(element) {
    return toUpper( element["Client"] != undefined ? element["Client"] + "@" + element["Position"] : element["client"] + "@" + element["skill"]);
  }

  this._locationDescriptionHashFunction = function(element) {
    return toUpper( element["Location"] != undefined ? element["Location"]: element["Work Office"] );
  }

  this._ticketDescriptionHashFunction = function(element) {
    var result;
    if (element instanceof Ticket){
      result = //element["name"] + "@" +
               element["client"] + "@" +
               //element["project"] + "@" +
               element["skill"] + "@" +
               element["seniority"] + "@" +
               element["location"] + "@" +
               element["cluster"];
    }
    else if(element instanceof HistoricTicket){
      result = element["key"];
    }
    else
    {
      result = //element["Name"] + "@" +
               element["Client"] + "@" +
               //element["Project"] + "@" +
               element["Position"] + "@" +
               element["Seniority"] + "@" +
               element["Work Office"] + "@" +
               element["Cluster"];

    }
    return result;
  }

  this._existsTicketInListHistoricTickets = function(ticket, listHistoricTickets){
    var i, historicTicket, result = null, wasFound = false;

    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      if (historicTicket.key === this._getTicketKey(ticket)){
        wasFound = true;
        break;
      }
    }
    if (wasFound){
      result = historicTicket;
    }
    else{
      result = null;
    }

    return result;
  };

  this._existsHistoricTicketInListTickets = function(historicTicket, listTickets){
    var i, ticket, result = null, wasFound = false;

    for (i in listTickets){
      ticket = listTickets[i];
      if (historicTicket.key === this._getTicketKey(ticket)){
        wasFound = true;
        break;
      }
    }

    if (wasFound){
      result = historicTicket;
    }
    else{
      result = null;
    }

    return result;
  }

  this._log = function(msg){
    if(this._logger)
      this._logger.log(msg);
    else{
      Logger.log(msg);
    }
  }

  var Ticket = function(){
    this.number = "";
    this.name = "";
    this.client = "";
    this.project = "";
    this.skill = "";
    this.seniority = "";
    this.location = "";
    this.openPosition = "";
    this.cluster = "";
    this.clientDescription = "";
    this.positionDescription = "";
    this.publish = "";
    //nuevos atributos
    this.programManagers = "";
    this.programManagersEmails = "";
    this.projectManagers = "";
    this.projectManagersEmails = "";
    this.technicalLeaders = "";
    this.technicalLeadersEmail = "";
    this.technicalDirector = "";
    this.technicalDirectorEmail = "";
  }

  var HistoricTicket = function(){
    this.key = "";
    this.number = "";
    this.name = "";
    this.client = "";
    this.project = "";
    this.position = "";
    this.seniority = "";
    this.workOffice = "";
    this.cluster = "";
    this.clientDescription = "";
    this.positionDescription = "";
    this.firstDateInAvailable = "";
    this.firstPublishDate = "";
    this.lastPublishDate = "";
  }

  var Glober = function() {
    this.rowID = "";
    this.user = "";
    this.createDate;
  }
  /***********************************************************************************************/
}

/*************************************************************************************************/
/* Normalise Library. Refactor and prepare to be moved as a Library                              */
/*                                                                                               */
/*************************************************************************************************/
var NormaliseLocationProcess = function() {
  this._LOCATIONS_REJECTED = new Array();
  this._LOCATIONS_MAPPING = null;
  this._COMPATIBLE_LOCATIONS_CACHE = {};
  this._NORMALISE_LOCATIONS_CACHE = {};

  this.compatibleLocations = function(locations1, locations2) {

    var hashKey = locations1+"|"+locations2;
    var mirrorHashKey = locations2+"|"+locations1;

    if( this._COMPATIBLE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var match = this._compatibleLocations(locations1, locations2);
      this._COMPATIBLE_LOCATIONS_CACHE[hashKey] = match;
      this._COMPATIBLE_LOCATIONS_CACHE[mirrorHashKey] = match;
    }

    return this._COMPATIBLE_LOCATIONS_CACHE[hashKey];
  }


  this.getLocationsRejected = function() {
    return this._LOCATIONS_REJECTED;
  }


  this.normaliseLocation = function(location) {

    var hashKey = location;

    if( this._NORMALISE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var normalised = this._normaliseLocation(location);
      this._NORMALISE_LOCATIONS_CACHE[hashKey] = normalised;
    }

    return this._NORMALISE_LOCATIONS_CACHE[hashKey];
  }

  this.locationIsAnywhere = function(location) {
    return this._prepareLocation(location) == "ANYWHERE";
  }


  /**********************************************************************************************************/
  this._compatibleLocations = function(locations1, locations2) {

    var normalisedLocation1Data = this._normaliseLocation(locations1);
    var normalisedLocation2Data = this._normaliseLocation(locations2);

    this._LOCATIONS_REJECTED = new Array();
    this._LOCATIONS_REJECTED.push.apply(normalisedLocation1Data.rejected, normalisedLocation2Data.rejected);

    var match = this._compatibleLocationArrays(normalisedLocation1Data.normalised, normalisedLocation2Data.normalised);
    return match;
  }


  this._prepareLocation = function(locationStr) {
    return locationStr.toLocaleUpperCase().trim();
  };


  this._setDefaultLocationsMapping = function() {
    this._LOCATIONS_MAPPING = getRows(getGlobersSuggestionsLocationsMappingSheet());

    for( var i = this._LOCATIONS_MAPPING.length-1; i >= 0; i-- ) {
      this._LOCATIONS_MAPPING[i]["Original"] = this._prepareLocation(this._LOCATIONS_MAPPING[i]["Original"]);
    }
  }


  this._compatibleLocationArrays = function(locationArray1, locationArray2)
  {
    if (!locationArray1) throw "Invalid Location: NULL";
    if (!locationArray2) throw "Invalid Location: NULL";

    for (i in locationArray1) {

      var location1 = locationArray1[i];
      for (j in locationArray2) {
        var location2 = locationArray2[j];

        if (!location1) throw "Invalid Location: NULL";
        if (!location2) throw "Invalid Location: NULL";

        if (location1 == "ANYWHERE") return true;
        if (location2 == "ANYWHERE") return true;
        if (location2 == location1) return true;

        if (location1.indexOf(location2) >= 0) return true;
        if (location2.indexOf(location1) >= 0) return true;
      }
    }

    return false;
  }

  /**
   * Signature: NormalisedData normaliseLocation(String)
   */
  this._normaliseLocation = function(locationStr) {

    if( locationStr == null ) new this._NormalisedData([], []);

    var separator = ",";
    var locationsArray = null;
    var preparedLocationsArray = new Array();

    var mappedLocationsArray = new Array();
    var rejectedLocationsArray = new Array();

    /*
    * Change to uppercase and trim locations given first, to avoid calling this process repeated times
    */
    if( locationStr.indexOf(separator) > 0 ) {
      locationsArray = locationStr.split(separator);
    }
    else {
      locationsArray = [ locationStr ];
    }
    for( var i = 0; i < locationsArray.length; i++ ) {
      preparedLocationsArray.push(this._prepareLocation(locationsArray[i]));
    }


    /*
     * Find location in mapping
     */
    if( this._LOCATIONS_MAPPING == null ) {
      this._setDefaultLocationsMapping();
    }

    for( var i in preparedLocationsArray ) {
      var trimmedUCLocation = preparedLocationsArray[i];
      var match = false;

      for(var j=0; j < this._LOCATIONS_MAPPING.length; j++) {
        if( this._LOCATIONS_MAPPING[j]["Original"] == trimmedUCLocation ) {
          mappedLocationsArray.push(this._LOCATIONS_MAPPING[j]["Normalised"]);
          match = true;
          break;
        }
      }

      if( !match ) {
        rejectedLocationsArray.push(locationsArray[i]);
      }
    }

    return new this._NormalisedData(mappedLocationsArray, rejectedLocationsArray);
  }

  this._NormalisedData = function(normalised, rejected) {
    this.normalised = normalised;
    this.rejected = rejected;
  }

}

function getOpenPositionsTicketsSourceSheet() {
  return getBenchSpreadsheet().getSheetByName("Tickets");
}

function getOpenPositionsProjectsSourceSheet() {
  return getBenchSpreadsheet().getSheetByName("Projects");
}


function testOpenPositionProcess (){
  Logger.log('Starting...');
  var object = new OpenPositionProccess();
  object._sendGlobersToStaff();
  Logger.log('Finished');
}








// source tab Module_ComputeHeadCount.gs


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










// source tab Module_ComputeAvailChecker.gs


function computeAvailChecker_cron()
{
//  var startingDate=addDaysToDate(1,new Date());
    var startingDate=new Date();

//Phase 1: Compute list of globers without assignment

  Logger.log("Start: compute globers with no assignment");
  var computation=new CCPOComputeAvailCheckerClass();
  var results=computation.compute(startingDate);
  var sheet =getAvailCheckerSheet();
  computation.saveResults(sheet,startingDate,results)
  Logger.log("End: compute globers with no assignment");


//Phase 2: Sync values to spreadshett used by everybody without loosing their changes and special columns

  Logger.log("Start: sync available sheet");
  var computation=new CCPOComputeAvailablesClass();
//  computation.setUpdateAvailableSheet(false);
  computation.run();
//  computation.informErrors("dario.robak@globant.com, francisco.rodriguez@globant.com,analia.altieri@globant.com");
  computation.informErrors("dario.robak@globant.com");

  Logger.log("End: sync available sheet");
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeAvailCheckerClass ()
{
  var errorList=new CCPOErrorListClass();
  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");

  /************************************************************/
  this.compute=function (dateToUse)
  {
    var date=normalizeDate(dateToUse);

    var releasesSheet =getGlowImport2Spreadsheet().getSheetByName("ReleasesActualAndFuture");
    var releaseRows = getRows(releasesSheet);

    releaseRows.sort(releasesSortFunction);

    var lastGloberId="";
    var results=[];

    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      var globerId=row["Glober ID"];

      if (globerId==lastGloberId)
        continue;

      //ignore rows ending before 'date'
      if (row["End Date"]!='null' && (normalizeDate(row["End Date"])<date))
        continue;

      var globerReleaseRows=[];
      for(var j=i;j<releaseRows.length;j++)
      {
        var row2=releaseRows[j];

        if (globerId!=row2["Glober ID"])
          break; //found another glober, get out of here

        //ignore rows ending before 'date'
        if (row2["End Date"]!='null' && (normalizeDate(row2["End Date"])<date))
        continue;

        //Fix dates
        row2["Starting Date"]=CCPODateUtils.makeWorkingDay(row2["Starting Date"]);
        if (row2["End Date"]=='null')
          row2["End Date"]=null;


        globerReleaseRows.push(row2);

      }
      handleGlober(date,results,globerId,globerReleaseRows);
      lastGloberId=globerId;
    }
    results.sort(resultsSortFunction);

    return results;
  }

  /************************************************************/
  function releasesSortFunction(a,b)
  {
    if (a["Glober ID"]<b["Glober ID"])
      return -1;
    if (a["Glober ID"]>b["Glober ID"])
      return 1;

    if (a["End Date"]<b["End Date"])
      return -1;
    if (a["End Date"]>b["End Date"])
      return 1;

    return (a.Percentage-b.Percentage);
  }

  /************************************************************/
  function handleGlober(date,results,globerId,releaseRows)
  {
    var glober=getGlober(globerId);
    if (!glober)
    {
      Logger.log("Cannot find glober: "+globerId+" "+releaseRows[0]["E-Mail"]);
    return;
    }
      //Logger.log("namdle "+glober.Email+","+releaseRows.length);

    //START: compute amount in bech now
    var percentInBench=0;
    var startDateInBench;
    var availability;
    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];
      var projectTag=row["Project TAG"];
      if (isGlobantBench(projectTag)) //Bench
      {
        var startDate=normalizeDate(row["Starting Date"]);
        //Logger.log(startDate+","+date);
        if (startDate<=date)
        {
          percentInBench+=row["Percentage"];
          availability=row["Availability"];
          if (!startDateInBench || startDate<normalizeDate(startDateInBench))
            startDateInBench=row["Starting Date"];
        }
      }
    }

    if (percentInBench>0)
      results.push({globerId:globerId,glober:glober,
                    projectTag:"N/A",availDate:startDateInBench,percentage:percentInBench,percentageBench:0,availability:availability});

    //END: compute amount in bech now

    for(var i=0;i<releaseRows.length;i++)
    {
      var row=releaseRows[i];

      var projectTag=row["Project TAG"];

      if (isGlobantBench(projectTag)) //Bench
      {
        continue; //ignore non-assigned
      }

      if (!row["End Date"])
        continue; //ignore never ending assignments

      var endDate=normalizeDate(row["End Date"]);
      var percentage=row["Percentage"];
      var availability=row["Availability"];
    //Logger.log("namdle "+endDate+","+percentage);

      //Handle all releases at the same day. Remember that they are sorted in end date ascending order
      for(var j=i+1;j<releaseRows.length;j++,i++)
      {
        var rowToCompare=releaseRows[j];
        if (!rowToCompare["End Date"])
          break;
        if(endDate!=normalizeDate(rowToCompare["End Date"]))
          break;

        if (isGlobantBench(rowToCompare["Project TAG"])) //Bench
          continue; //ignore non-assigned

        percentage+=rowToCompare["Percentage"];

      }

      var nextDate=CCPODateUtils.makeWorkingDay(addDaysToDate(1,row["End Date"]));
      var nextDateNormalized=normalizeDate(nextDate) ;

      //Handle all releases starting the next day
      var percentageBench=0;
      for(var j=i+1;j<releaseRows.length;j++)
      {
        var rowToCompare=releaseRows[j];
        if (nextDateNormalized!=normalizeDate(rowToCompare["Starting Date"]))
          continue;

        if (isGlobantBench(rowToCompare["Project TAG"])) //Bench
          percentageBench+=rowToCompare["Percentage"];
        else
          percentage-=rowToCompare["Percentage"];

      }
      var release={globerId:globerId,glober:glober,
                   projectTag:projectTag,availDate:nextDate,percentage:percentage,percentageBench:percentageBench,availability:availability};


      if (percentageBench<percentage )
        Logger.log("Error in bench assignment:"+glober.Email+","+projectTag+","+endDate+","+percentage+","+percentageBench);

      if (percentage>0)
        results.push(release);
    }

  }

  /************************************************************/
  this.saveResults=function (sheet,dateUsed,results)
  {
    var dateComputed=normalizeDate(dateUsed);
    var maxDate=normalizeDate(addDaysToDate(21,dateUsed));

    var values=[];
    var headers=["DateComputed","globerId", "Email","role", "seniority"
                 ,"availDate", "percentage","entryDate","location","english","uploadCV","studio","staff","projectTag","client","project","Comment","availability"];


    values.push(headers);
    for(var i=0;i<results.length;i++)
    {
      row=[dateComputed];
      d=results[i];

      if (normalizeDate(d.availDate)>maxDate)
        continue;

      var project;
      if(d.projectTag!="N/A")
        project=getProject(d.projectTag);
      else
        project={Client:"N/A", Project:"N/A"}

      d.entryDate=d.glober["Entry Date"];	
      d.location=d.glober["Glober Office"];	
      d.english=d.glober["English level"];
      d.uploadCV=d.glober["Upload CV"];
      d.studio=d.glober["Glober Studio"];	
      d.staff=d.glober["Staff"];
      d.Email=d.glober.Email;
      d.role=d.glober.Role;
      d.seniority=d.glober.Seniority;
      d.Comment=""
      d.client=project.Client;
      d.project=project.Project;
      if (!d.availDate) d.availDate="NOW!";

      for(var j=1;j<headers.length;j++)
        row.push(d[headers[j]]);

      values.push(row);
    }
    saveSheetValues(values,sheet,1000);
  }


  /************************************************************/
  function resultsSortFunction(a,b)
  {
    if (a["availDate"]<b["availDate"])
      return -1;
    if (a["availDate"]>b["availDate"])
      return 1;

    if (a["globerId"]<b["globerId"])
      return -1;
    if (a["globerId"]>b["globerId"])
      return 1;

    return a.percentage-b.percentage;
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


}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeAvailablesClass()
{
  var HEADER_EMAIL="Email";
  var errorList=new CCPOErrorListClass();
  var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");

  var origSheet = getAvailCheckerSheet();
  //var destSheet = getTestingAvailableSheet();
  var destSheet = getBenchSpreadsheet().getSheetByName("New Available");

  var ignoreListSheet = getGlowImportSpreadsheet().getSheetByName("EmailIgnoreList");
  var updateAvailableSheet=true;

  //Headers
  //Name	Email	%	Location	Skill	Seniority	Studio	English	Bench Start Date	Aging	Source	Assignment	Handler Team	Plan	Start Date	Assignment Plan Ticket #	Copia Nombre	Assignment Plan Description	Assignment Plan Client	Stage	SeniorityRange	Weak	Weak: Description	Weak: MailSent	Weak: Start date	TicketEntrevista	Fecha CV actualizado	PlanAgainsTargetDate	Vacaciones	Staffing Suggestions

  this.setUpdateAvailableSheet=function(value)
  {
    updateAvailableSheet=value;
  }

  /************************************************************/
  this.run=function ()
  {
    var currentTime=new Date().getTime();
    var lastRow=destSheet.getLastRow();

    var computedAvailGlobers=getRows(origSheet);
    var destValues=getRows(destSheet);
    var ignoreListValues=getRows(ignoreListSheet);
    //Logger.log(ignoreListValues);

    var computedAvailglobersIdx=getHeaderIndexes(origSheet)
    var destIdx=getHeaderIndexes(destSheet)

    Logger.log("Phase 1");

    var percentValues=new Array(destValues.length);
    var startDateValues=new Array(destValues.length);


    //for each row in destination, see if the row appears in origen
    for(var i=0;i<destValues.length;i++)
    {
      var destObj=destValues[i];
      var destEmail=destObj[HEADER_EMAIL];

      percentValues[i]=new Array(1);
      startDateValues[i]=new Array(1);
      percentValues[i][0]=destObj["%"];
      startDateValues[i][0]=destObj["Bench Start Date"];

      if (destEmail=="" || destEmail=="NH")
        continue;


      var positionFound=lookForValueInRows(destEmail,computedAvailGlobers,"Email");
      if(positionFound>=0)
      {
        percentValues[i][0]=computedAvailGlobers[positionFound]["percentage"];
        startDateValues[i][0]=computedAvailGlobers[positionFound]["availDate"];
        computedAvailGlobers[positionFound].alreadyHandled=1;
        computedAvailGlobers[positionFound]["Email"]="ALREADYHANDLED"; //To avoid matching it again

      }
      else
      {
        percentValues[i][0]="NOT LONGER FREE";
        startDateValues[i][0]="NOT LONGER FREE";
      }

    }

    if (updateAvailableSheet)
    {
      destSheet.getRange(2,destIdx["%"],percentValues.length,1).setValues(percentValues);
      destSheet.getRange(2,destIdx["Bench Start Date"],startDateValues.length,1).setValues(startDateValues);

      //Remove rows NOT LONGER FREE
      for(var i=destValues.length-1;i>=0;i--)
      {
        if (percentValues[i][0]=="NOT LONGER FREE")
        {
          Logger.log("Deleting row: "+i+" "+destValues[i][HEADER_EMAIL]);
          destSheet.deleteRow(i+2);  //i+2 to take into account headers plus rows starting at 1 instead of 0.
        }
      }
    }
    Logger.log("Phase 2");

    //Add new rows and update existing ones
    //For each row in origen look for it in dest. If found update fields, if not found create new and update fields
    var rowsToAdd=new Array();
    for(var i=0;i<computedAvailGlobers.length;i++)
    {
      var origObj=computedAvailGlobers[i];
      var origEmail=origObj[HEADER_EMAIL];

      //var positionFound=lookForValueInRows(origEmail,destValues,"Email");
      if (computedAvailGlobers[i].alreadyHandled)
        continue;



      var positionFound=lookForValueInRows(origEmail,ignoreListValues,"Email");
      if ( positionFound >=0)
        continue;

      rowsToAdd.push(origObj);
      //check new people in less than 12 days, but no newhires (3 days allowance)
      var oneHourMillis=1000*60*60.0;

      if (origObj.availDate.getTime()-currentTime<12/*days*/ * 24/* hours/day */ * oneHourMillis)
      if (origObj.entryDate.getTime()  -currentTime> 3/*days*/ * 24/* hours/day */ * oneHourMillis)
      {
        //Check to see if its only a change in startdate. only report cases that appear out of the blue
        positionFound=lookForValueInRows(origEmail,destValues,"Email");
        if ( positionFound <0)
          errorList.addError("Available in less than 14 days:"+origEmail+", percent:"+origObj.percentage+", availdate:"+normalizeDate(origObj.availDate)+", entryDate:"+normalizeDate(origObj.entryDate),"NEWAVAIL");
      }
    }

    Logger.log("Adding "+rowsToAdd.length+" globers");
    var values=[];
    var today=new Date();
    for(var i=0;i<rowsToAdd.length;i++)
    {

  //Name	Email	%	Location	Skill	Seniority	Studio	English	Bench Start Date	Aging	Source	Assignment	Handler Team	Plan	Availability Start Date	Assignment Plan Ticket #	Copia Nombre	Assignment Plan Description	Assignment Plan Client	Stage	SeniorityRange	Weak	Weak: Description	Weak: MailSent	Weak: Start date	TicketEntrevista	Fecha CV actualizado	PlanAgainsTargetDate	Vacaciones	Staffing Suggestions
//DateComputed	globerId	Email	role	seniority	availDate	percentage	entryDate	location	english	uploadCV	studio	staff	projectTag	client	project	Comment			
      var row=rowsToAdd[i];

      var seniorityRange=seniorityRangeMap[row.seniority];
      if (seniorityRange)
        row.seniorityRange=seniorityRange.SeniorityRange;
      else
        row.seniorityRange="NOTFOUND";


      values.push([
      row.globerId,row.Email, row.percentage, row.location,row.role,row.seniority,row.studio,row.english,row.availDate,null,null,row.seniorityRange,row.client+"/"+row.project,today,"","noplan",row.availability
      ]);
    }
    saveSheetValues(values,destSheet,1000,true);


  }

  this.informErrors=function(emailAddress)
  {
    errorList.sendEmailWithErrors(emailAddress,"AvailChecker Process");
  }

}
  /***************************************/









// source tab Module_GloberSkills.gs
function test_testasdert()
{
  var globerSkills=new CCPOGloberSkillsClass();
  //var result=globerSkills.getGloberSkills(1003,5);
  //Logger.log(result);

  /*
  var result=globerSkills.getGloberSkillsByEmail("jose.forero@globant.com",2);
  Logger.log(result);
  return;
  */

  var results=globerSkills.getGlobersWithSkills(["python"],4);
  //Logger.log(results);

  var outputSheet=getTestingSpreadsheet().getSheetByName("FindGlobersWithSkillOutput");
  var headers=getSheetHeaders(outputSheet);
  saveSheetObjs(headers,results,outputSheet,1000,false);

/*
  result=globerSkills.getGlobersWithSkills(["java",".net"],5);
  Logger.log(result);
  result=globerSkills.getGlobersWithSkills(["ruby"],4);
  Logger.log(result);
*/
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOGloberSkillsClass()
{

  var spreadsheet = getGloberSkillsSpreadsheet();
  var skillsSheet=spreadsheet.getSheetByName("Skills");
  var globerSkillsSheet=spreadsheet.getSheetByName("GloberSkills");
  var globerMapById=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var globerMapByEmail=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");

  var allGlobersSkills=getRows(globerSkillsSheet);
  var allSkills=computeMap(skillsSheet, "id");
  allGlobersSkills.sort(sortGloberSkillsFunction);

  function sortGloberSkillsFunction(a,b)
  {
    if (a["ID Glober"] < b["ID Glober"])
      return -1;
    if (a["ID Glober"] > b["ID Glober"])
      return 1;

    return a.Knowledge-b.Knowledge;
  }

  /************************************************************/
  this.getGloberSkillsByEmail=function (email,minValue)
  {
    var glober=globerMapByEmail[email];
    if (!glober)
      throw ("Invalid Glober");
    return this.getGloberSkills(glober["Glober ID"],minValue);
  }

  /************************************************************/
  this.getGloberSkills=function (globerId,minValue)
  {
    var result=[];
    for(var i=0;i<allGlobersSkills.length;i++)
    {
      var row=allGlobersSkills[i];
      if (row["ID Glober"]!=globerId)
        continue;
      if (row["Knowledge"]<minValue)
        continue;

      var skill=allSkills[row["ID Skill"]];
      var resultValue={globerId:globerId,skillId:row["ID Skill"],skillName:skill.name,skillPath:skill.path,knowledge:row["Knowledge"]}

      result.push(resultValue);

    }
    result.sort(function(a,b){return b.knowledge-a.knowledge;});
    return result;
  }


  /************************************************************/
  this.getGlobersWithSkills=function (skillsToSearch,minValue)
  {
    minValue=minValue||4;
    for(var j=0;j<skillsToSearch.length;j++)
      skillsToSearch[j]=skillsToSearch[j].toLowerCase();


    var result=[];
    var lastGloberId="";

    for(var i=0;i<allGlobersSkills.length;i++)
    {
      if (allGlobersSkills[i]["Knowledge"]<minValue)
        continue;
      var globerId=allGlobersSkills[i]["ID Glober"];
      if (globerId==lastGloberId )
        continue; //already handled

      lastGloberId=globerId;
      var globerSkills=[];

      for(var j=i;j<allGlobersSkills.length;j++)
      {
        var theGloberSkillInfo=allGlobersSkills[j];
        if (theGloberSkillInfo["Knowledge"]<minValue)
          continue;
        if (globerId!=theGloberSkillInfo["ID Glober"])
          break;
        var tempskill=allSkills[theGloberSkillInfo["ID Skill"]];
        if (tempskill!=null)
          globerSkills.push(tempskill);
        else
          Logger.log("Cannot find skill ID: "+theGloberSkillInfo["ID Skill"]);

      }

      var globerHasAllSkills=true;
      for(var j=0;j<skillsToSearch.length;j++)
      {
        for(var k=0;k<globerSkills.length;k++)
        {
          var found=false;
          var theSkill=globerSkills[k];

          if (theSkill.name.toLowerCase().indexOf(skillsToSearch[j])>=0)
          {
            found=true;
            break;
          }
        }
        if (!found)
        {
          globerHasAllSkills=false; //this glober doesnt have all skills
          break;
        }
      }
      if (globerHasAllSkills)
        result.push(globerMapById[globerId]);
    }
    return result;
  }


}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/*** NO ES USADA!!!   */

function CCPOBitArrayClass(_size,_initialBit)
{
  var size=_size;
  var bits=new Array(size);

  if (!_initialBit) _initialBit=false;

  for(var i=0;i<size;i++)
    bits[i]=_initialBit;

  /************************************************************/
  this.set=function (n,bit)
  {
    assert(n>=0,"n:"+n);
    assert(n<size,"BitArray size:"+size+", n:"+n);
    bits[n]=bit;
  }

  /************************************************************/
  this.get=function (n,bit)
  {
    assert(n>=0,"n:"+n);
    assert(n<size,"BitArray size:"+size+", n:"+n);
    return bits[n];
  }

  /************************************************************/
  this.allOn=function ()
  {
    for(var i=0;i<size;i++)
      if (bits[i]) return false;
    return true;

  }

}








// source tab Library_ErrorListClass.gs

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOErrorListClass ()
{
  var errorList=new Array();

  this.addError=function(errorMsg,errorType)
  {
    if (!errorType) errorType="ERROR";
    errorList.push({error:errorMsg,type:errorType});
    Logger.log(errorType+":"+errorMsg);
  }
  this.clear=function()
  {
    errorList=new Array();
  }

  this.sendEmailWithErrors=function (emailAddress,subject,errorType)
  {
    var filteredErrorList=new Array();

    if (errorType)
    {
      for (var i=0;i<errorList.length;i++)
      {
        if (errorList[i].type==errorType)
          filteredErrorList.push(errorList[i]);

      }
    }
    else
      filteredErrorList=errorList;

    if (filteredErrorList.length<1) return; //nothing to report

     //send email to emailAddress
    Logger.log("sending email to:"+emailAddress);

    var emailText=subject+"\r\nError Report:\r\n";
    emailText=emailText+"# of errors:"+filteredErrorList.length+"\r\n";
    emailText=emailText+"--------------\r\n";

    for (var i=0;i<filteredErrorList.length;i++)
    {
      emailText=emailText+filteredErrorList[i].error+"\r\n";
    }
    emailText=emailText+"--------------\r\n";
    MailApp.sendEmail(emailAddress, subject, emailText);

  }
}








// source tab Module_TicketProcessing.gs

/***
This Module computes a list of tickets without handler and sends email informing the ticket number to responsibles
*/


function findTicketsWithProblems_cron()
{
  if (!CCPODateUtils.isWorkingDay()) return;
  var outputSheet =getTestingSpreadsheet().getSheetByName("TicketsWithProblems");
  var computation=new CCPOTicketsProcessingClass();
  computation.findTicketsWithProblems(outputSheet,"dario.robak@globant.com, nicolas.gerpe@globant.com, analia.altieri@globant.com,veronica.gimenez@globant.com");
}

/*
//No longer needed as the tickets are imported from glow automatically
function updateTicketsFields_cron()
{
   var computation=new CCPOTicketsProcessingClass();
  computation.updateTicketsFields("nicolas.gerpe@globant.com");
}
*/

function testsyncTicketsWithGlow()
{
    var computation=new CCPOTicketsProcessingClass();
    computation.syncTicketsWithGlow("dario.robak@globant.com");
}

function generateTicketByBucketReport_cron()
{
  var computation=new CCPOTicketsProcessingClass();
  var emails="nicolas.gerpe@globant.com,dario.robak@globant.com,analia.altieri@globant.com,bernardo.manzella@globant.com,mercedes.macpherson@globant.com";
  //emails="dario.robak@globant.com";
  computation.generateTicketByBucketReport(emails    );
Logger.log("end");
}

function sendEmailsAboutBucket()
{
  var computation=new CCPOTicketsProcessingClass();
  computation.sendEmailsAboutBucket();
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/* Headers Ticket
Number	
Name	
Handler	
Submit Date	
Update Date	
Studio	
Glow Submitter	
Client	
Project	
Position	
Seniority	
Type of Assignment	
Load	
Start Date	
Work Office	
Estimated Travel Period	
Replacement	
Client Interview Required?	
Handler Team	
Stage	
Aging	
Priority	
OpenPosition	
Cluster	BU	
ProjectTag	
ProjectState	
Staffing Suggestions	
TL	
TD	
Bucket (Weeks)	
Days to comply SLA	
SeniorityRange	
bucketInformed
*/


function CCPOTicketsProcessingClass()
{
  var errorList=new CCPOErrorListClass();
//  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
//  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var ticketsSheet =  getBenchSpreadsheet().getSheetByName("Tickets");//getGlowImportSpreadsheet().getSheetByName("TicketsTS");
  var ticketsRows = getRows(ticketsSheet);
  var headers=getSheetHeaders(ticketsSheet);


  this.findTicketsWithProblems=function (outputSheet,emailsRecipients)
  {
    errorList.clear();
    var dateToUse=new Date();
    var results=[];
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];

      var handler=row.Handler;
      var handlerTeam=row["Handler Team"];
      var submitDate=row["Submit Date"];
      var number=row.Number;
     // Logger.log(number)
      if (dateToUse.getTime()-submitDate.getTime()<1000*60*60*48) //report only after 48hrs
          continue;

      var hasError=false;

      ticketDescription= ""+ number+" (submitted "+normalizeDate(submitDate)+", aging: "+row.Aging+") "+row.Client+"/"+row.Project+"/"+row.Studio;
      if (isEmptyString(handlerTeam))
      {
        errorList.addError("No team: "+ticketDescription, "NOHANDLERTEAM");
        hasError=true;
      }
      else if (isEmptyString(handler))
      {
        errorList.addError("No handler: "+ticketDescription, "NOHANDLER");
        hasError=true;
      }

      if (isEmptyString(row.TD) && row.Client!="Globant")
      {
        errorList.addError("No TD: "+ticketDescription, "NOTD");
        hasError=true;
      }



      if (!hasError)
        continue;

      //Logger.log(row);
      results.push(row);
    }

    if (outputSheet)
    {
      saveSheetObjs(headers,results,outputSheet,1000);
    }

    var oneHourMillis=1000*60*60.0;
    if (emailsRecipients && hasElapsedEnoughTime("Tickets Without Handler Process_informErrors",23*oneHourMillis))
    {
      //emailsRecipients="dario.robak@globant.com";
      errorList.sendEmailWithErrors(emailsRecipients,"Tickets Without Handler Process");
    }
    errorList.clear();

  }



  /////////////////////////////////////////////////////////////////
  /*
  this.updateTicketsFields=function (emailsRecipients)
  {
    errorList.clear();
    var ticketHeadersIdx=getHeaderIndexes(ticketsSheet);
    var projectRows=getRows(getGlowImportSpreadsheet().getSheetByName("Projects"));
    var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");

    //Columns to compute
    var columnsToCompute=["ProjectTag","ProjectState","Bucket (Weeks)","BU","TL","TD","Priority","SeniorityRange","Aging","Cluster","Days to comply SLA"];
    var today=new Date().getTime();
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];

      row.Aging = Math.floor((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
      //row.Stage	=arrayformula(if(U2:U>=0,"Stage 1",if(N2:N<=Constants!$B$2,"Stage 1 Sunday","Stage 2: week " & (weeknum(N2:N)))))


      row.Cluster ="Offshore";
      try{
      if (row["Type of Assignment"].indexOf("Vacation")>=0) row.Cluster ="Vacations";
      else if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
      else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
      else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
      else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
      else if (row["Replacement"].indexOf("Yes")==0) row.Cluster ="A replacement";
      }  catch(e) {};



      //Cumpute project tag
      row.ProjectTag="NOT_FOUND";
      for(var j=0; j<projectRows.length;j++)
      {
        var project=projectRows[j];
        if (project.Client==row.Client && project.Project==row.Project)
        {
          row.ProjectTag=project["Project Tag"];
          row.ProjectState=project["Project State"];
          row.BU=project["Business Unit"];
          row.TL=project["Current Technical Leaders"];
          row.TD=project["Current Technical Director"];
          break;
        }
      }
      if (row.ProjectTag=="NOT_FOUND")
        errorList.addError("Cannot compute project tag. Ticket: "+row.Number+" . ");

      //Compute Bucket
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,false);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;
      row["Days to comply SLA"]=-row.Aging+row["Bucket (Weeks)"]*7;

      //compute priority

      //=(vlookup(H240,Accounts!A:B,2,false)+U240*if(U240<0,2,1))*if(U240<0,1,if(Q240="Yes",0.5,1))
      var account=accountsMap[row.Client];
      var priority=0;
      if(account)
        priority+=account.PriorityPoints;

      var aging=row.Aging;
      var replacement=("Yes"==row.Replacement);
      if(aging)
      {
        if(aging<0)
          priority+=2*aging;
        else
          priority+=Math.floor(aging/(replacement?2:1));
      }
      row.Priority=priority;

      //compute seniorityRange
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
      {
        row["SeniorityRange"]="NOTFOUND";
      }

    }


    for(var j=0;j<columnsToCompute.length;j++)
    {
      var columnNumber=ticketHeadersIdx[columnsToCompute[j]];
      Logger.log(columnNumber);
      var values=new Array(ticketsRows.length);
      for(var i=0;i<ticketsRows.length;i++)
      {
        values[i]=new Array(1);
        values[i][0]=ticketsRows[i][columnsToCompute[j]];
      }
      ticketsSheet.getRange(2,columnNumber,values.length,1).setValues(values);

    }

    if (emailsRecipients)
    {
      var oneHourMillis=1000*60*60.0;
      //emailsRecipients="dario.robak@globant.com";
      if (hasElapsedEnoughTime("updateTicketsFields_informErrors",70*oneHourMillis))
        errorList.sendEmailWithErrors(emailsRecipients,"UpdateTicketsFields Process");
    }
    errorList.clear();

  }
*/
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  this.syncTicketsWithGlow=function (emailsRecipients)
  {
    errorList.clear();

    var originalTicketsMap=computeMap(ticketsSheet, "Number");
    var accountsMap=computeMap(getAccountPrioritiesSheet(), "Account");


    var ticketsGlowSheet = getGlowImport2Spreadsheet().getSheetByName("TicketsGlow");
    var ticketHeadersIdx=getHeaderIndexes(ticketsGlowSheet);
    var ticketsGlowRows = getRows(ticketsGlowSheet);

    var projectRows=getRows(getGlowImportSpreadsheet().getSheetByName("Projects"));
    var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");
    var today=new Date().getTime();
    //Columns to compute
    //var columnsToCompute=["ProjectTag","ProjectState","Bucket (Weeks)","BU","TL","TD","Priority","SeniorityRange"];

    var result=[];
    for(var i=0;i<ticketsGlowRows.length;i++)
    {
      var row=ticketsGlowRows[i];
      if (row.StageGlow=="Stage 3") continue;

      try
      {
        //Make sure the ticket number starts with #
        if (typeof row.Number === 'number')
          row.Number="#"+row.Number;

        row.Aging = Math.round((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
        row.Stage	=row.Aging>=0?"Stage 1":("Stage 2: week " +getDateWeek(row["Start Date"]));
      }
      catch(e)
      {
        errorList.addError("Cannot compute STAGE. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+")");
        continue;
      };


      row.Cluster ="Offshore";
      try{
        /*if (row["Type of Assignment"].indexOf("Vacation")>=0) row.Cluster ="Vacations";
        else
        */
        if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
        else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
        else if (row["Replacement"].indexOf("Yes")==0)
        {
          if (isEmptyString(row["Replacement Type"]) || row["Replacement Type"].indexOf("PERMANENT")==0)
            row.Cluster ="A replacement";
          else
            row.Cluster ="Temp replacement";

        }
      }

      catch(e)
      {
        errorList.addError("Cannot compute cluster. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+")");
        continue;
      };


      //Cumpute project tag
        row.ProjectTag="NOT_FOUND";
        for(var j=0; j<projectRows.length;j++)
        {
          var project=projectRows[j];
          if (project.Client==row.Client && project.Project==row.Project)
          {
            row.ProjectTag=project["Project Tag"];
            row.ProjectState=project["Project State"];
            row.BU=project["Business Unit"];
            row.TL=project["Current Technical Leaders"];
            row.TD=project["Current Technical Director"];
            break;
          }
        }
        if (row.ProjectTag=="NOT_FOUND")
          errorList.addError("Cannot compute project tag. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+"). ");

      //Compute Bucket
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,row.Cluster);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;
      row["Days to comply SLA"]=bucket-row.Aging;
      if (row["Days to comply SLA"]<0)
        row["Days to comply SLA"]="Overdue";

      //compute priority

      //=(vlookup(H240,Accounts!A:B,2,false)+U240*if(U240<0,2,1))*if(U240<0,1,if(Q240="Yes",0.5,1))
      var account=accountsMap[row.Client];
      var priority=0;
      if(account)
        priority+=account.PriorityPoints;

      var aging=row.Aging;
      var replacement=("Yes"==row.Replacement);
      if(aging)
      {
        if(aging<0)
          priority+=2*aging;
        else
          priority+=Math.floor(aging/(replacement?2:1));
      }
      row.Priority=priority;

      //compute seniorityRange
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
      {
        row["SeniorityRange"]="NOTFOUND";
      }



      //Save values given by the staffing team
      var originalTicket=originalTicketsMap[row.Number];
      if (originalTicket)
      {
        row.OpenPosition=originalTicket.OpenPosition;
        row.bucketInformed=originalTicket.bucketInformed;
        if (isEmptyString(row.ProjectTag) || row.ProjectTag=="NOT_FOUND")
        {
          if (!isEmptyString(originalTicket.ProjectTag))
          {
            row.ProjectTag=originalTicket.ProjectTag;
          }
        }

      }
      else
      {
        Logger.log("Cannot find originalTicket:"+row.Number);
      }

      result.push(row);
    }

    Logger.log("About to save tickets");
    var outputSheet =  ticketsSheet; //getBenchSpreadsheet().getSheetByName("New Tickets");
    assert(outputSheet,"Cannot open outputSheet");
    saveSheetObjs(headers,result,outputSheet,1000,false);
    Logger.log("Saved!");

    var oneHourMillis=1000*60*60.0;

    if (emailsRecipients && hasElapsedEnoughTime("SyncTicketsWithGlow_informErrors",70*oneHourMillis))
        errorList.sendEmailWithErrors(emailsRecipients,"Automatic sync of tickets with Glow process");

    errorList.clear();

  }

  /************************************************************/
  function formatDate(currentDate)
  {
    if (!currentDate) return;
    return CCPODateUtils.asShortString(currentDate);
  }


  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  this.generateTicketByBucketReport=function (emailsRecipients,BU)
  {
    errorList.clear();
    var dateToUse=new Date();

    var cluster=[[],[]];  //2 arrays, first for offshore, second for onsite
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];
      if (BU && BU!=row.BU)
        continue;
      if (row.Client=="Globant") continue;

      var ticket={};
      ticket.number=row.Number;
      ticket.bucket=row["Bucket (Weeks)"];
      ticket.startDate=formatDate(row["Start Date"]);
      ticket.staffingWindowEnd=formatDate(addDaysToDate(ticket.bucket*7,row["Start Date"]));
      if (row["Days to comply SLA"]=="Overdue")
        ticket.remainingDaysNumber=-1;
      else
        ticket.remainingDaysNumber=row["Days to comply SLA"];

      if (ticket.remainingDaysNumber<0)
      {
        ticket.remainingDays="<B>Overdue</B>"
        ticket.htmlRowBGColor="red";//"#CC2222";
      }
      else
      {
        if (ticket.remainingDaysNumber<=13)
          ticket.htmlRowBGColor="yellow";
        else
        {
          if (row.Aging>=0)  //Stage 1
            ticket.htmlRowBGColor="green";
          else
            ticket.htmlRowBGColor="#C0C0C0";

        }
        ticket.remainingDays=ticket.remainingDaysNumber;
      }
      ticket.client=row.Client;
      ticket.project=row.Project;
      ticket.position=row.Position;
      ticket.seniority=row.Seniority;
      ticket.location=row["Work Office"];
      ticket.interview=row["Client Interview Required?"];
      ticket.handler=row["Handler Team"];


      var arrayPosition=0;
      if (row.Cluster=="Onsite")
        arrayPosition=1;
      cluster[arrayPosition].push(ticket);
    }
//    cluster[0].sort(function(a,b){return 10000*(b.bucket-a.bucket)+a.remainingDaysNumber-b.remainingDaysNumber});
//    cluster[1].sort(function(a,b){return 10000*(b.bucket-a.bucket)+a.remainingDaysNumber-b.remainingDaysNumber});
//    cluster[0].sort(function(a,b){return compareStrings(a.staffingWindowEnd,b.staffingWindowEnd)});
//    cluster[1].sort(function(a,b){return compareStrings(a.staffingWindowEnd,b.staffingWindowEnd)});
    cluster[0].sort(function(a,b){return a.remainingDaysNumber-b.remainingDaysNumber});
    cluster[1].sort(function(a,b){return a.remainingDaysNumber-b.remainingDaysNumber});

    if (emailsRecipients)
    {
      var subject="Tickets by bucket report"+(BU?(" for "+BU):"");
      var headers=["bucket","number","client","startDate","staffingWindowEnd","remainingDays","position","interview","handler"];
      sendTableEmailFromObjs (subject,emailsRecipients, cluster, [headers,headers],true,["Tickets Offshore", "Tickets Onsite"]);
    }
    errorList.clear();

  }



  this.sendEmailsAboutBucket=function ()
  {
    errorList.clear();
    var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
    var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");
    var ticketHeadersIdx=getHeaderIndexes(ticketsSheet);

    var dateToUse=new Date();

    var columnNumber=ticketHeadersIdx["bucketInformed"];
    Logger.log(columnNumber);
    assert(columnNumber,"Canot find column bucketInformed in tickets sheet");
    var values=new Array(ticketsRows.length);

    var clientTicketsMap={};

    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];

      values[i]=[row.bucketInformed];
      var bucketInformed=row.bucketInformed;
      var number=row.Number;

      if (bucketInformed)
          continue;
      if ("Globant"==row.Client)
      {
        values[i]=[null];//["Globant"];
        continue;
      }
      var project=projectMap[row.ProjectTag];
      if (!project)
      {
        values[i]=[null];
        continue;
      }


      var emails=[];
      if (!isEmptyString(row["Glow Submitter"]))
        emails.push(row["Glow Submitter"]+"@globant.com");

      emails=addEmailsToArray(emails,project["Current Delivery Directors Emails"]);
      emails=addEmailsToArray(emails,project["Current Project Managers Emails"]);
      emails=addEmailsToArray(emails,project["Current Technical Director Email"]);
      emails=emails.filter(function(elem, pos, self) {
          return self.indexOf(elem) == pos;
        });

      values[i]=[normalizeDate(dateToUse)];



      //Group by client
      var clientTickets=clientTicketsMap[row.Client];
      if (!clientTickets)
      {
        clientTicketsMap[row.Client]={client:row.Client,tickets:[row],emailsToSendBucketInfo:emails};
      }
      else
      {
        clientTickets.tickets.push(row);
        emails=emails.concat(clientTickets.emailsToSendBucketInfo);
        clientTickets.emailsToSendBucketInfo = emails.filter(function(elem, pos, self) {
          return self.indexOf(elem) == pos;
        });

      }
    }

    sendEmailsAboutBucketToClientStakeholders(clientTicketsMap);

    //Update sheet informing when the email was sent
    ticketsSheet.getRange(2,columnNumber,values.length,1).setValues(values);
    errorList.clear();

  }

  function addEmailsToArray(emails,values)
  {
    if (isEmptyString(values))
      return emails;
    var valuesSplitted=values.split(   " - " );
    //Logger.log(valuesSplitted);
    return emails.concat(valuesSplitted);
  }

  function sendEmailsAboutBucketToClientStakeholders (clientTicketsMap)
  {
    for (var key in clientTicketsMap)
    {
      var clientTickets=clientTicketsMap[key];
      Logger.log(clientTickets.client+"/"+clientTickets.tickets.length+"/"+clientTickets.emailsToSendBucketInfo);

      var subject="Bucket information on new tickets for client: "+clientTickets.client;

      var htmlTable="<body><center><h2>"+subject+"</h2><br />\r\n";
      htmlTable+="Below you can find the staffing window for the tickets recently added. Please review and make adjustments to the ticket to improve staffing times, if necessary<br /><br />\r\n"

      var values=[];
      var fields=["Ticket #","Project Name","Position","Bucket (Weeks)", "Staffing Window Start Date","Staffing Window End Date"];
      for(var i=0;i<clientTickets.tickets.length;i++)
      {
        var row=clientTickets.tickets[i];
        var value={};

        value["Ticket #"]=row.Number;
        value["Project Name"]=row.Project;
        value["Position"]=row.Position;
        value["Staffing Window Start Date"]=CCPODateUtils.asShortString(row["Start Date"]);
        value["Bucket (Weeks)"]=row["Bucket (Weeks)"];
        value["Staffing Window End Date"]=CCPODateUtils.asShortString(addDaysToDate(value["Bucket (Weeks)"]*7,row["Start Date"]));

        values.push(value);
      }
      htmlTable+=convertArrayToHTML(values, fields);
      htmlTable+="\r\n</center></body>\r\n";

      var emailRecipients=clientTickets.emailsToSendBucketInfo.join();
      emailRecipients="dario.robak@globant.com, nicolas.gerpe@globant.com";
      GmailApp.sendEmail(emailRecipients,subject,"This is an HTML email",{htmlBody: htmlTable});
      Logger.log("email enviado");
    };

  }


}









// source tab Library_computeTicketBucket.gs

/***********************************************************************************************************************/
function getDaysOfComputedBucket(location, skill, seniority, interviewRequired, client,cluster)
{
  if(
    toLower(client) != "globant"      &&
    toLower(skill) != "bis manager"   &&
    toLower(skill) != "transactional services manager"
    )
    return 7 * callComputeBucket_(location, skill, seniority, interviewRequired,cluster).smartStaffingTimesAgreement;
  else
    return 7*7;
}


function test_getDaysOfComputedBucket()
{
  var location="AR/BsAs/GLB-NorthPark";
  var skill="Staffing Manager";
  var seniority="Sr";
  var interviewRequired="No";
  var client="Bally Technologies";
  var bucket=getDaysOfComputedBucket(location, skill, seniority, interviewRequired, client,"offshore");
  Logger.log(bucket);

      //getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,false);

}

/***********************************************************************************************************************/
function callComputeBucket_(location, skill, seniority, interviewRequired,cluster) {

  location = toLower(location);
  skill = toLower(skill);
  seniority = toLower(seniority);
  interviewRequired = (toLower(interviewRequired) == "yes");
  cluster = toLower(cluster);

  var valueToAdjust=0;
//  if (internalAdjust) valueToAdjust=1;

  if( matchesBucket1(location, skill, seniority, interviewRequired,cluster) )
  {
    return bucket1();
  }
  else if( matchesBucket2(location, skill, seniority, interviewRequired,cluster) )
  {
    var result=bucket2();
    result.smartStaffingTimesAgreement-=valueToAdjust;
    return result;
  }
  else if( matchesBucket3(location, skill, seniority, interviewRequired,cluster) )
  {
    var result=bucket3();
    result.smartStaffingTimesAgreement-=valueToAdjust;
    return result;

  }
  else if( matchesBucket4(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket4();
  } else if( matchesBucket5(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket5();
  } else if( matchesBucket6(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket6();
  } else {
    return nobucket();
  }
}


/***********************************************************************************************************************/
var MAIN_TECH_SKILLS = {
  ".net developer" : true,
  "business analyst" : true,
  "graphic designer" : true,
  "visual designer" : true,
  "html designer" : true,
  "java developer" : true,
  "php developer" : true,
  "qc analyst" : true,
  "analyst_fa" : true,
  "quality assurance analyst" : true,
  "test automation engineer" : true,
  "sharepoint developer" : true,
  "test automation engineering" : true,
  "qc automation" : true,
  "game tester" : true,
  "qc game analyst" : true,
  "software engineer - ui" : true,
  "web ui developer" : true

};
function skillIsMainTech(skill) {
  return MAIN_TECH_SKILLS[skill] == true;
}

var TEACH_LEAD_SKILLS = {
  "lead" : true,
  "leader" : true,
  "tech lead" : true,
  "techlead"  : true,
  "team lead" : true,
  "architect" : true,
  "software designer" : true,
  "team lead-it qual assur" : true,
  "tech mgr i-sys/architecture" : true,
  "tech master" : true
};
function skillIsTechLead(skill) {
  return TEACH_LEAD_SKILLS[skill] == true;
}

function positionIsTechLead(position) {
  return position.indexOf("tl") >= 0;
}


var OPERATIONS_SKILLS = {
  "project analyst" : true,
  "project manager" : true,
  "staff manager" : true,
  "agile project manager" : true,
  "staffing manager" : true,
  "team lead-it proj mgt" : true,
  "tech mgr i-it proj mgt" : true,
};
function skillIsOperations(skill) {
  return OPERATIONS_SKILLS[skill] == true;
}


var MOBILE_TECH_SKILLS = {
  "android mobile developer" : true,
  "ios mobile developer" : true,
  "mobile developer" : true,
  "windows mobile developer" : true,
  "blackberry developer" : true,
  "hybrid mobile developer" : true
};
function skillIsMobileTech(skill) {
  return MOBILE_TECH_SKILLS[skill] == true;
}


var SECONDARY_SKILLS = {
  "business intelligence" : true,
  "action script developer" : true,
  "help desk pro" : true,
  "database administrator" : true,
  "drupal developer" : true,
  "net engineer" : true,
  "unity developer" : true,
  "user experience designer" : true,
  "python developer" : true,
  "qci analyst" : true,
  "consultant" : true,
  "ruby developer" : true,
  "perl developer" : true,
  "specialist engineer" : true,
  "sql developer" : true,
  "sysadmin engineer" : true,
  "data architecture engineer" : true,
  "cloud architect (aws)" : true,
  "data scientist" : true,
  "content analyst" : true,
  "product champion" : true,
  "big data architect leader" : true,
  "load & performance specialist" : true,
  "post- production leader" : true,
  "c++ developer" : true,
  "security specialist" : true,
  "server administrator" : true,
  "interface designer" : true,
  "internet marketing analyst" : true,
  "pl admin" : true,
  "product analyst" : true,
  "client partner" : true,
  "web analytics specialist" : true,
  "game designer" : true

};
function skillIsSecondary(skill) {
  return SECONDARY_SKILLS[skill] == true;
}


/***********************************************************************************************************************/
function matchesBucket1(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);
	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		||
		(
			skillIsOperations(skill)
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket2(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			skillIsOperations(skill)
			&& !isOnsite_(location,cluster)
		)
		||
		(
			(skillIsTechLead(skill) || seniorityNdx > 6)
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket3(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMobileTech(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			seniorityNdx > 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			skillIsSecondary(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			(skillIsTechLead(skill) || seniorityNdx > 6)
			&& (!isAnywhere_(location) || interviewRequired)
			&& !isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket4(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
            && isOnsite_(location,cluster)
		)
		||
		(
			skillIsOperations(skill)
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket5(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			((skillIsMainTech(skill) && seniorityNdx > 6) || skillIsTechLead(skill))
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket6(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			(skillIsMobileTech(skill) || skillIsSecondary(skill))
			&& seniorityNdx <= 6
            && isOnsite_(location,cluster)
		)
		||
		(
			seniorityNdx > 6
            && isOnsite_(location,cluster)
		)
		||
		(
			(
              ((skillIsMobileTech(skill) || skillIsSecondary(skill))
              && seniorityNdx > 6) || skillIsTechLead(skill)
            )
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
//function is___Specific_(location,cluster) { return !isOnsite_(location,cluster) && !isAnywhere_(location); }
function isOnsite_(location,cluster) { return "onsite"==cluster; }
function isAnywhere_(location) { return location == "anywhere"; }

/***********************************************************************************************************************/
function getSeniorities() {
	return ["tr", "tr adv", "jr", "jr adv", "ssr", "ssr adv", "sr", "sd", "architect", "sr adv", "tech master"];
}

/***********************************************************************************************************************/
function nobucket() { return bucketN(0, 0); }
function bucket1() { return bucketN(1, 3); }
function bucket2() { return bucketN(2, 5); }
function bucket3() { return bucketN(3, 7); }
function bucket4() { return bucketN(4, 4); }
function bucket5() { return bucketN(5, 5); }
function bucket6() { return bucketN(6, 6); }

function bucketN(bucketNum, smartStaffingTimesAgreement) {
	return {"bucketNum": bucketNum, "smartStaffingTimesAgreement" : smartStaffingTimesAgreement};
}








// source tab Module_AvailableProcessing.gs
function updateAvailableFields_cron()
{
  var computation=new CCPOAvailableProcessingClass();
  computation.updateAvailableFields();
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOAvailableProcessingClass()
{
  var errorList=new CCPOErrorListClass();
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");
  var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");
  var availSheet =  getBenchSpreadsheet().getSheetByName("Available");
  var availRows = getRows(availSheet);
  var headers=getSheetHeaders(availSheet);


  /////////////////////////////////////////////////////////////////
  this.updateAvailableFields=function ()
  {
    var headersIdx=getHeaderIndexes(availSheet);
    var globerSkills=new CCPOGloberSkillsClass();

    errorList.clear();
    var skillComputations=0; //it takes a lot of time to compute, we only do some of them every run
    var today=new Date().getTime();
    //Columns to compute
    var columnsToCompute=["Fecha CV actualizado","SeniorityRange","Copia Nombre","English","Studio","globerId","canTravel","Knowledge", "Location"];//,"Aging"];
    for(var i=0;i<availRows.length;i++)
    {
      var row=availRows[i];

      try{
      row.Aging = Math.floor((today-row["Bench Start Date"].getTime())/1000/3600/24);
      }catch(e) {} /* ignore date errors */

      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
        row["SeniorityRange"]="NOTFOUND";

      row["Copia Nombre"]=row["Name"];
      if ("NH"==row.Email)
        continue;


      var glober=globerMap[row.Email];

      if (glober)
      {
        row["Fecha CV actualizado"]=glober["Upload CV"];
        row["English"]=glober["English level"];
        row["Studio"]=glober["Glober Studio"];
        row["globerId"]=glober["Glober ID"];
        row["canTravel"]=glober["Max Time Abroad"];

        var location=glober["Glober Office"].split("/");
        if (location[0])
        {
          if (location[1])
            row["Location"]=location[0]+"/"+location[1];
          else
            row["Location"]=location[0];
        }

        row["Knowledge"]="NOTCOMPUTED";
/* encontrar una manera de que no ocupe mucho espacio en la ui
        if (skillComputations<150 && isEmptyString(row["Knowledge"]))
        {
          skillComputations++;
          Logger.log(""+skillComputations+") Computing Skills:"+row.Email);
          var theSkills=globerSkills.getGloberSkillsByEmail(row.Email,4);
          theSkills.sort(function(a,b){return b.knowledge-a.knowledge;});

          row["Knowledge"]="";

          var maxValues=10;
          for(var j=0;j<theSkills.length && maxValues>0;j++)
          {
            if (theSkills[j].skillPath.indexOf("Behavioral")>=0)
              continue;
            if (theSkills[j].skillPath.indexOf("/General Shared Skills /Languages/Spanish")>=0)
              continue;
            if (theSkills[j].skillPath.indexOf("/General Shared Skills /Languages/English")>=0)
              continue;
            if (theSkills[j].skillPath.indexOf("/PM/")>=0)
              continue;

            if (theSkills[j].skillPath.indexOf("Globant")==0) //if starts with "Globant"
            {
              row["Knowledge"]+=theSkills[j].skillName+","+theSkills[j].knowledge+"\r\n";
              maxValues--;
            }
          }
          if (isEmptyString(row["Knowledge"]))
            row["Knowledge"]="NOTFOUND";

        }
        */
      }
      else
        Logger.log("Email not found: "+row.Email);
    }

    for(var j=0;j<columnsToCompute.length;j++)
    {
      var columnNumber=headersIdx[columnsToCompute[j]];

      var values=new Array(availRows.length);
      for(var i=0;i<availRows.length;i++)
      {
        values[i]=new Array(1);
        values[i][0]=availRows[i][columnsToCompute[j]];
      }
      availSheet.getRange(2,columnNumber,values.length,1).setValues(values);

    }

  }

}








// source tab Module_ComputeDispersion.gs


function computeDispersion_cron()
{
  var computation=new CCPOComputeDispersionClass();
  var dateToUse=new Date();
  var results=computation.compute(dateToUse);
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeDispersionClass ()
{
  var errorList     = new CCPOErrorListClass();
  var projectMap    = computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap     = computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var assignments   = new CCPOAssignmentClass();
  var dateToUse     = new Date();
  var currentAssignments   = assignments.getAllAssignmentsForDate(dateToUse);

  /************************************************************/
  this.compute=function (dateToUse)
  {
    for(var i=0;i<currentAssignments.length;i++)
    {
      var row=currentAssignments[i];

      var globerId=row["Glober ID"];

      if (!isNumber(globerId))
      {
        addError("Invalid glober ID: "+globerId);
        continue;
      }

      var glober=getGlober(row["Glober ID"]);
      if (!glober)
        glober={Email:"N/A",Role:"N/A",Seniority:"N/A",Staff:false};

      var projectTag=row["Project TAG"];
      var project=getProject(projectTag);

      //check for projects belonging to clients
      if (project["Billing Flag"] && project["Client TAG"]!="GLO001")
      {
      }
    }
  }



  /************************************************************/
/*
Example:
How to save results
this.saveSummary=function (sheet)
  {
    for(var i=0;i<summaryList.length;i++)
    {
      var d=summaryList[i];
      row=[];
      for(var j=0;j<keysSummary.length;j++)
        row.push(d[keysSummary[j]]);

      sheet.appendRow(row);

    }
  }
*/
  function isNumber(n)
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
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

}
//////////////////////////////////////////////////////








// source tab Library_AssignmentClass.gs


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








// source tab Module_ComputeOrgChart.gs


function computeOrgChart_cron()
{
  var computation=new CCPOComputeOrgChartClass();
  var results=computation.computeOrgChart();

  Logger.log("About to save orgChart");
  var outputSheet =  getTestingSpreadsheet().getSheetByName("OrgChart");
  assert(outputSheet,"Cannot open outputSheet");
  var headers=getSheetHeaders(outputSheet);
  saveSheetObjs(headers,results,outputSheet,1000,false);
  Logger.log("Org Chart Saved!");
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeOrgChartClass ()
{
  var errorList     = new CCPOErrorListClass();
  var projectMap    = computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  var globerMap     = computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var globers       = getRows(getGlowImportSpreadsheet().getSheetByName("Globers"));
  var orgUnitMap    = computeMap(getOrgUnitsSheet(), "ID");

  /************************************************************/
  this.computeOrgChart=function ()
  {
    var dateToUse     = new Date();
    var assignments   = new CCPOAssignmentClass();
    var globerAssignmentsMap=assignments.getGloberAssignmentsMap(dateToUse);

    var orgChart=[];
    for(var i=0;i<globers.length;i++)
    {
      var glober=globers[i];
      var orgUnit=orgUnitMap[glober["Organizational Unit"]];
      assert(orgUnit,"Cannot find org unit: "+glober["Organizational Unit"]);


      if (useOrgUnitManager(orgUnit))
      {
        var globerReportsTo={
          globerId:glober["Glober ID"],
          globerEmail:glober.Email,
          orgUnit:getOrgUnitPath(orgUnit),
          role:glober["Role"],
          seniority:glober["Seniority"],
          staff:true
        }


        var reportsTo;
        var orgUnit2=orgUnit;
        do{
          reportsTo=orgUnit2.Manager+"@globant.com";
          orgUnit2=orgUnitMap[orgUnit2["Parent ID"]];
        }while (reportsTo==glober.Email && orgUnit2);

        globerReportsTo.reportsToEmail=reportsTo;
        globerReportsTo.reportsToId="TBD";

        //Logger.log(glober.Email+ " reports to "+reportsTo+"["+orgUnit.Name+"]");

        orgChart.push(globerReportsTo);

      }
      else
      {
        //Use assignments

        var globerAssignments=globerAssignmentsMap[glober["Glober ID"]];

        if (!globerAssignments || globerAssignments.length<1)
        {
          Logger.log("No assignments for glober:"+glober.Email);
          continue;
        }

        for(var pos=0;pos<globerAssignments.length;pos++)
        {
          var assignment=globerAssignments[pos];
          var globerReportsTo={
            globerId:glober["Glober ID"],
            globerEmail:glober.Email,
            orgUnit:getOrgUnitPath(orgUnit),
            cantPMs:0,
            assignments:globerAssignments.length,
            role:glober["Role"],
            seniority:glober["Seniority"],
            percentage:assignment.Percentage,
            staff:false
          }

          var projectTag=assignment["Project TAG"];
          var project=getProject(projectTag);
          if (!project)
          {
            Logger.log("Cannot find project tag: :"+assignment["Project TAG"]);
            continue;
          }

          globerReportsTo.project=project["Project"];
          if ("Delivery Director"==glober["Role"])
          {
            globerReportsTo.reportsToEmail=assignment["Business Unit"];
            orgChart.push(globerReportsTo);
            break; //stop looking at assignments.
          }

          if ("Project Managers"==orgUnit.Name)
          {
            globerReportsTo.reportsToEmail=project["Current Delivery Directors Emails"];
            orgChart.push(globerReportsTo);
            continue;
          }

          //check for projects belonging to clients
          //if (project["Billing Flag"] && project["Client TAG"]!="GLO001")
          //{
            globerReportsTo.reportsToEmail=project["Current Project Managers Emails"];
            if (!isEmptyString(globerReportsTo.reportsToEmail))
            {
              globerReportsTo.cantPMs=globerReportsTo.reportsToEmail.split("-").length;
            }

          //}
          orgChart.push(globerReportsTo);
        }

      }

    }
    return orgChart;
  }


  /************************************************************/
  function getOrgUnitPath(orgUnit)
  {
    if (orgUnit.path) return orgUnit.path;
    if (orgUnit["Parent ID"]=="null")
    {
      orgUnit.path="";
    }
    else
    {
      parentOrgUnit=orgUnitMap[orgUnit["Parent ID"]];
      orgUnit.path=getOrgUnitPath(parentOrgUnit)+"/"+orgUnit.Name;
    }
    return orgUnit.path;
  }

    /************************************************************/
  function getProject(projectTag)
  {
//    assert(projectTag in projectMap,"Cannot find project:"+projectTag);
    return projectMap[projectTag];
  }

  /************************************************************/
  function useOrgUnitManager(orgUnit)
  {
    if (orgUnit.Staff=="TRUE")
      return true;

    //check for billable people: 70000169 ="Generic S"
    if (orgUnit["Parent ID"]=="70000169")
      return false;

    if (orgUnit.Name=="Project Managers")
      return false;

    return true;
  }

  /************************************************************/
  function getGlober(globerId)
  {
    //assert(globerId in globerMap,"Cannot find glober:"+globerId);
    return globerMap[globerId];
  }

}
//////////////////////////////////////////////////////








// source tab Module_NewHiresProcessing.gs
function computeNewHiresForecast_cron()
{
  if (!CCPODateUtils.isWorkingDay()) return;

  var computation=new CCPONewHiresProcessingClass();

  var emailAddress="nicolas.gerpe@globant.com,mercedes.macpherson@globant.com,dario.robak@globant.com, analia.altieri@globant.com, bernardo.manzella@globant.com,delfina.montoya@globant.com";
  //emailAddress="dario.robak@globant.com";

  computation.computeForecast(emailAddress);
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPONewHiresProcessingClass()
{
  var errorList=new CCPOErrorListClass();
  var newHiresSheet =  getNewHiresSpreadsheet().getSheetByName("NEW HIRES");
  var newHiresRows = getRows(newHiresSheet);
  var headers=getSheetHeaders(newHiresSheet);
  var headersIdx=getHeaderIndexes(newHiresSheet);

/*
Headers:
Marca temporal	Nombre de usuario	DNI	Nombre y Apellido	Billable?	Position	
Si en la pregunta anterior contestaste "Otra", indicala a continuacion	
Seniority	Technical Interview	
Fecha de Ingreso	
Modalidad	Type	ExGlober?	Salary	% FDB	Vacaciones	Preocupacional	
Plan de Salud	Target de Bono	Inducción	Asignación	
Ticket/Studio/CECO	PM/Manager	Location	Office	Source	Glober Referente	
En caso de ser un portal de empleo, fue un aviso o busqueda en base?	Observaciones	Recruiter 1	Recruiter 2	
Team		
Cancelar ingreso?	English Level	Oficina de Preferencia	Unidad Organizativa
*/
  /////////////////////////////////////////////////////////////////
  this.computeForecast=function (emailAddress)
  {
    errorList.clear();
    var yearToCompute=new Date().getYear();
    var firstWeekToCompute=0;//getDateWeek(new Date())-4;
    var baseMonday=findWeekday(1,new Date());
    var baseMondayWeek=getDateWeek(baseMonday);

    var weekCounters={};
    var monthCounters={};

    for(var i=0;i<newHiresRows.length;i++)
    {
      var row=newHiresRows[i];
      var week,month;
      try
      {
        if (isEmptyString(row["Nombre y Apellido"])) continue;  //ignore empty rows
        if (!isEmptyString(row["Cancelar ingreso?"])) continue;   //ignore canceled rows

        var year=row["Fecha de Ingreso"].getYear();
        week=getDateWeek(row["Fecha de Ingreso"]);
        month=row["Fecha de Ingreso"].getMonth()+1;
        if (year<yearToCompute)
          continue;
      }
      catch(e)
      {
        Logger.log("Error: "+row["Fecha de Ingreso"]+row["Nombre y Apellido"]);
        continue;
      }
     //Logger.log("Week:"+week+"  "+normalizeDate(row["Fecha de Ingreso"])+":"+row["Nombre y Apellido"]);
      if (week>=firstWeekToCompute)
      {
        var weekCounter=weekCounters[week];
        if (!weekCounter)
        {
          var daysCorrection=7*(week-baseMondayWeek);
          var date=normalizeDate(addDaysToDate(daysCorrection,baseMonday));
          weekCounter={dateComputed:normalizeDate(new Date()),week:week,date:date,newHires:0,newHiresBillable:0,newHiresStaff:0,newHiresTicket:0,newHiresUS:0};
          weekCounters[week]=weekCounter;
        }
        weekCounter.newHires++;
        if ("Billable"==row["Billable?"])
        {
          weekCounter.newHiresBillable++;
          if (row["Team"] && "PUSH TEAM"==row["Team"].toUpperCase())
          {
            weekCounter.newHiresUS++;
          }
        }
        else
          weekCounter.newHiresStaff++;

        if ("Ticket"==row["Asignación"])
          weekCounter.newHiresTicket++;
      }

      var monthCounter=monthCounters[month];
      if (!monthCounter)
      {
        monthCounter={dateComputed:normalizeDate(new Date()),month:month,newHires:0,newHiresBillable:0,newHiresStaff:0,newHiresTicket:0,newHiresUS:0};
        monthCounters[month]=monthCounter;
      }
      monthCounter.newHires++;

      if ("Billable"==row["Billable?"])
      {
        monthCounter.newHiresBillable++;
        if (row["Team"] && "PUSH TEAM"==row["Team"].toUpperCase())
        {
          monthCounter.newHiresUS++;
        }
      }
      else
        monthCounter.newHiresStaff++;

      if ("Ticket"==row["Asignación"])
        monthCounter.newHiresTicket++;

    }
    Logger.log(monthCounters);

    var weekCounterArray=convertDictionaryToArray(weekCounters);
    weekCounterArray.sort(function(a,b){return b.week-a.week;});

    var outputHeaders=["dateComputed","week","date","newHires","newHiresBillable","newHiresStaff","newHiresTicket","newHiresUS"];
    var outputSheet=getTestingSpreadsheet().getSheetByName("NewHiresForecast");

    saveSheetObjs(outputHeaders,weekCounterArray,outputSheet,1000,true);

    var monthCounterArray=convertDictionaryToArray(monthCounters);
    monthCounterArray.sort(function(a,b){return b.month-a.month;});

    if (emailAddress)
    {
      var values=[monthCounterArray,weekCounterArray];
      var headers=[
        ["month","newHires","newHiresBillable","newHiresTicket","newHiresStaff","newHiresUS"],
        ["week","date","newHires","newHiresBillable","newHiresTicket","newHiresStaff","newHiresUS"]
      ];
      var titles=["Month Actuals","Week Actuals"];
      sendTableEmailFromObjs ("New Hires - Year  "+yearToCompute,emailAddress,values,headers,true,titles)
    }
  }



}








// source tab GERPE_AllTicketProcessing.gs

function updateGerpeTicketsFields_cron()
{
  var computation=new GerpeCCPOTicketsProcessingClass_();
  computation.updateTicketsFields();
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function GerpeCCPOTicketsProcessingClass_()
{
  var errorList=new CCPOErrorListClass();
  var spreadsheet=SpreadsheetApp.openById("1vcZ17mRImWaAk8QC0wKqgH8KAxdbsmRRYpQx31aHGbg");
  assert(spreadsheet,"cannot open spreadsheet");

  var ticketsSheet =  spreadsheet.getSheetByName("Tickets");
  assert(ticketsSheet,"cannot open sheet");

  var ticketsRows = getRows(ticketsSheet);
  var headers=getSheetHeaders(ticketsSheet);

  var accountsMap=computeMap(getAccountPrioritiesSheet(), "Account");

  /////////////////////////////////////////////////////////////////
  this.updateTicketsFields=function (emailsRecipients)
  {
    errorList.clear();
    var ticketHeadersIdx=getHeaderIndexes(ticketsSheet);
    var projectRows=getRows(getGlowImportSpreadsheet().getSheetByName("Projects"));
    var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");

    //Columns to compute
    var columnsToCompute=["ProjectTag","ProjectState","Bucket (Weeks)","BU","TL","TD","Priority","SeniorityRange","Aging","Cluster","Days to comply SLA"];
    var today=new Date().getTime();
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];

      try{
        var thetime=row["Start Date"].getTime();
      }catch(e){
        Logger.log("Error en Start date:"+row.Number);
        row.Aging="BAD_START_DATE";
      continue;
      }
      row.Aging = Math.floor((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
      //row.Stage	=arrayformula(if(U2:U>=0,"Stage 1",if(N2:N<=Constants!$B$2,"Stage 1 Sunday","Stage 2: week " & (weeknum(N2:N)))))


      row.Cluster ="Offshore";
      try{
        if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
        else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
        else if (row["Replacement"].indexOf("Yes")==0) row.Cluster ="A replacement";
      }  catch(e) {};

      row["Days to comply SLA"]=-row.Aging+row["Bucket (Weeks)"]*7;


      //Cumpute project tag
      row.ProjectTag="NOT_FOUND";
      for(var j=0; j<projectRows.length;j++)
      {
        var project=projectRows[j];
        if (project.Client==row.Client && project.Project==row.Project)
        {
          row.ProjectTag=project["Project Tag"];
          row.ProjectState=project["Project State"];
          row.BU=project["Business Unit"];
          row.TL=project["Current Technical Leaders"];
          row.TD=project["Current Technical Director"];
          break;
        }
      }
      if (row.ProjectTag=="NOT_FOUND")
        errorList.addError("Cannot compute project tag. Ticket: "+row.Number+" . ");

      //Compute Bucket
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,row.Cluster);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;

      //compute priority

      //=(vlookup(H240,Accounts!A:B,2,false)+U240*if(U240<0,2,1))*if(U240<0,1,if(Q240="Yes",0.5,1))
      var account=accountsMap[row.Client];
      var priority=0;
      if(account)
        priority+=account.PriorityPoints;

      var aging=row.Aging;
      var replacement=("Yes"==row.Replacement);
      if(aging)
      {
        if(aging<0)
          priority+=2*aging;
        else
          priority+=Math.floor(aging/(replacement?2:1));
      }
      row.Priority=priority;

      //compute seniorityRange
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
      {
        row["SeniorityRange"]="NOTFOUND";
      }

    }


    for(var j=0;j<columnsToCompute.length;j++)
    {
      var columnNumber=ticketHeadersIdx[columnsToCompute[j]];
      Logger.log(columnNumber);
      var values=new Array(ticketsRows.length);
      for(var i=0;i<ticketsRows.length;i++)
      {
        values[i]=new Array(1);
        values[i][0]=ticketsRows[i][columnsToCompute[j]];
      }
      ticketsSheet.getRange(2,columnNumber,values.length,1).setValues(values);

    }

    if (emailsRecipients)
    {
      //emailsRecipients="dario.robak@globant.com";
      errorList.sendEmailWithErrors(emailsRecipients,"Tickets Without Bucket Process");
    }
    errorList.clear();

  }

}









// source tab Module_Scheduler.gs

function startScheduler_cron()
{
  var configCls = new CCPOConfigClass();
  var configTable = configCls.getConfig('Scheduler');
  var config = tableToConfig(configTable);

  var scheduler = new CCPOTaskSchedulerClass(config);

  //register handlers
  //scheduler.registerHandler('IMPORT_GLOBERS', TEST_FUNCTION); //test function: test.gs
  //scheduler.registerHandler('PROCESS_GLOBERS', TEST_FUNCTION); //test function: test.gs
  //scheduler.registerHandler('COMPUTE_BENCH_COST', TEST_FUNCTION); //test function: test.gs

  scheduler.start();
}


//CCPOTaskSchedulerClass class
var CCPOTaskSchedulerClass = function (config) {
  //returns a new instance of the class if called without the new operator
  if(this instanceof CCPOTaskSchedulerClass === false) { return new CCPOTaskSchedulerClass(config); }

  this.schedulerName = config.schedulerName;
  this.tasks = config.tasks;
  this.handlers = {};

  this.dateService = { getDate: function() { return new Date(); } };
  this.driveService = DriveApp;
  this.propertiesService = PropertiesService;

  this.executionLog = tryParseJSON(this.propertiesService.getUserProperties().getProperty('CCPOTaskSchedulerClass_EXECUTION_LOG')) || [];
  this.statistics = tryParseJSON(this.propertiesService.getUserProperties().getProperty('CCPOTaskSchedulerClass_STATISTICS')) || { startTime: this.dateService.getDate() };
};

//CCPOTaskSchedulerClass prototype
CCPOTaskSchedulerClass.prototype = (function () {
  var start = function () {
    Logger.log('Starting scheduler execution');

    var readyTasks = getReadyTasks.call(this);

    Logger.log('Found ' + readyTasks.length + ' tasks ready to be executed');

    var errorInfo = null;
    if(readyTasks.length > 0) {
      var nextTask = getNextTask.call(this, readyTasks);

      Logger.log('Task ' + nextTask.id + ' is the next to be executed');

      var taskExecutionInfo = {
        executionStartTime: this.dateService.getDate().getTime(),
        taskId: nextTask.id
      };

      try {
        taskExecutionInfo.executionResult = executeTask.call(this, nextTask);
      } catch(e) {
        taskExecutionInfo.executionResult = 'FAIL';
        taskExecutionInfo.error = e.message || e;
        errorInfo = e;
      }

      taskExecutionInfo.executionEndTime = this.dateService.getDate().getTime();
      taskExecutionInfo.duration = taskExecutionInfo.executionEndTime - taskExecutionInfo.executionStartTime;

      Logger.log('Finished executing task ' + nextTask.id);
      Logger.log('Execution result: ' + taskExecutionInfo.executionResult);
      Logger.log('Execution duration: ' + taskExecutionInfo.duration + 'ms');

      if(taskExecutionInfo.executionResult == 'SUCCESS') {
        Logger.log('Removing old entries from the execution log');
        removeLogByTaskId(this.executionLog, nextTask.id);
      }
      this.executionLog.push(taskExecutionInfo);

      var stats = this.statistics[nextTask.id];
      if (!stats) {
        stats = {
          executionCount: 0,
          successfulExecutionCount: 0,
          failedExecutionCount: 0,
          totalExecutionTime: 0
        };
      }

      stats.totalExecutionTime += taskExecutionInfo.duration;
      stats.executionCount++;
      stats.averageExecutionTime = stats.totalExecutionTime / stats.executionCount;
      stats.lastExecutionTime = taskExecutionInfo.executionStartTime;
      if (taskExecutionInfo.executionResult == 'SUCCESS') {
        stats.successfulExecutionCount++;
        stats.lastSuccessfulExecutionTime = taskExecutionInfo.executionStartTime;
      } else {
        stats.failedExecutionCount++;
      }
      this.statistics[nextTask.id] = stats;
    } else {
      Logger.log('No task ready to be executed.');
    }

    this.propertiesService.getUserProperties().setProperty('CCPOTaskSchedulerClass_EXECUTION_LOG', JSON.stringify(this.executionLog));
    this.propertiesService.getUserProperties().setProperty('CCPOTaskSchedulerClass_STATISTICS', JSON.stringify(this.statistics));

    Logger.log('Finished scheduler execution');
    if (errorInfo) {
      throw errorInfo;
    }
  };

  //filters the task list by checking whether or not they are ready to be executed
  var getReadyTasks = function () {
    Logger.log('Checking for ready tasks');
    var readyTasks = [];
    for(var i = 0; i < this.tasks.length; i++) {
      var task = this.tasks[i];
      Logger.log('Checking task ' + task.id);
      var ready = true;
      for(var j = 0; j < task.dependencies.length; j++) {
        var dependency = task.dependencies[j];
        Logger.log('Checking dependecy ' + dependency.type);
        switch(dependency.type) {
          case 'AFTER':
            var depTaskId = dependency.param1;
            var depLastRun = this.statistics[depTaskId] ? this.statistics[depTaskId].lastSuccessfulExecutionTime : 0;
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;

            if(!depLastRun || lastRun > depLastRun) {
              ready = false;
              Logger.log('Task has already run after ' + depTaskId);
            } else {
              Logger.log('Task hasn\'t run after ' + depTaskId);
            }

            break;
          case 'BETWEEN_HOURS':
            var h1 = parseInt(dependency.param1.split(':')[0], 10), m1 = parseInt(dependency.param1.split(':')[1], 10);
            var h2 = parseInt(dependency.param2.split(':')[0], 10), m2 = parseInt(dependency.param2.split(':')[1], 10);
            var dt = this.dateService.getDate();
            var ch = dt.getHours(), cm = dt.getMinutes();

            var isBetween = false;
            if(h2 > h1 || (h2 === h1 && m2 >= m1)) {
              isBetween = (ch > h1 || (ch === h1 && cm >= m1)) && (h2 > ch || (h2 === ch && m2 >= cm));
            } else {
              isBetween = (ch > h1 || (ch === h1 && cm >= m1)) || (h2 > ch || (h2 === ch && m2 >= cm));
            }

            if(isBetween) {
              Logger.log('Current time (' + zeroPad(ch) + ':' + zeroPad(cm) + ') is between ' + zeroPad(h1) + ':' + zeroPad(m1) + ' and ' + zeroPad(h2) + ':' + zeroPad(m2));
            } else {
              Logger.log('Current time (' + zeroPad(ch) + ':' + zeroPad(cm) + ') is NOT between ' + zeroPad(h1) + ':' + zeroPad(m1) + ' and ' + zeroPad(h2) + ':' + zeroPad(m2));
              ready = false;
            }

            break;
          case 'CHECK_FILE':
            var file = dependency.param1;
            var parts = file.split('/');
            var exists = true;
            var folder = this.driveService.getRootFolder();
            for(var k = 0; k < parts.length - 1 && exists; k++) {
              if(parts[k] === '') { continue; }
              var folderIt = folder.getFoldersByName(parts[k]);
              if(folderIt.hasNext()) {
                folder = folderIt.next();
              } else {
                Logger.log('Folder ' + parts[k] + ' not found');
                exists = false;
              }
            }
            if(exists) {
              var fileIt = folder.getFilesByName(parts[parts.length - 1]);
              if(!fileIt.hasNext()) {
                Logger.log('File ' + parts[parts.length - 1] + ' not found');
                exists = false;
              } else {
                Logger.log('File ' + file + ' found');
              }
            }
            if(!exists) {
              ready = false;
            }
            break;
          case 'EVERY_X_HOURS':
            var xHours = dependency.param1;
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              var now = this.dateService.getDate().getTime();
              if(now - lastRun < xHours * 3600000) {
                Logger.log('Task has already run in the last ' + xHours + ' hour(s)');
                ready = false;
              } else {
                Logger.log('Task hasn\'t run in the last ' + xHours + ' hour(s)');
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          case 'ONCE_A_DAY':
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              lastRun = new Date(lastRun);
              Logger.log('Task last run ' + lastRun);
              var now = this.dateService.getDate();
              if(lastRun.getDate() === now.getDate() && lastRun.getMonth() === now.getMonth() && lastRun.getFullYear() === now.getFullYear()) {
                Logger.log('Task has already run today');
                ready = false;
              } else {
                Logger.log('Task hasn\'t run today');
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          case 'ONCE_A_WEEK':
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              lastRun = new Date(lastRun);
              Logger.log('Task last run ' + lastRun);
              var now = this.dateService.getDate();
              if(getDateWeek(lastRun) === getDateWeek(now)) {
                Logger.log('Task has already run this week');
                ready = false;
              } else {
                Logger.log('Task hasn\'t run this week');
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          default:
            Logger.log('Dependency type not found');
            break;
        }
      }
      if(ready) {
        Logger.log('Task ' + task.id + ' is ready');
        readyTasks.push(task);
      }
    }
    return readyTasks;
  };

  //identifies the next task to be executed
  var getNextTask = function (readyTasks) {
    Logger.log('Getting next task');
    var nextTask = null;
    var olderTime = 0;
    for(var i = 0; i < readyTasks.length; i++) {
      var task = readyTasks[i];
      Logger.log('Checking task ' + task.id);
      var lastExecutionTime = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
      Logger.log('Last execution: ' + lastExecutionTime);
      if(nextTask === null || lastExecutionTime < olderTime) {
        nextTask = task;
        olderTime = lastExecutionTime;
      }
    }
    return nextTask;
  };

  //executes the task
  var executeTask = function (task) {
    Logger.log('Executing task ' + task.id);

    if(this.handlers[task.id]) {
      this.handlers[task.id]();
    } else {
      throw new Error('No handler registered for task ' + task.id);
    }

    return 'SUCCESS';
  };

  //remove every entry in the array with taskId equals to the passed value
  var removeLogByTaskId = function (executionLog, taskId) {
    for(var i = executionLog.length - 1; i >= 0; i--) {
      if(executionLog[i].taskId === taskId) {
        executionLog.splice(i, 1);
      }
    }
  };

  var zeroPad = function (n) {
    return n < 10 ? '0' + n : n;
  };

  var registerHandler = function(key, handler) {
    this.handlers[key] = handler;
  };

  //exposes the public methods
  return {
    start: start,
    registerHandler: registerHandler
  };
}) ();

//tries to parse a JSON, return null when it fails
var tryParseJSON = function (str) {
  try { return JSON.parse(str); }
  catch(ex) { return null; }
};

var tableToConfig = function (table, schedulerName) {
  var config = {
    schedulerName: schedulerName || 'CCPOTaskScheduler',
    tasks: []
  };

  var currentTask = null;
  for(var i = 0; i < table.length; i++) {
    if(!currentTask || currentTask.id !== table[i].ID) {
      if(currentTask) { config.tasks.push(currentTask); }
      currentTask = {
        id: table[i].ID,
        description: table[i].Description,
        duration: table[i].Duration,
        dependencies: []
      }
    };

    var dep = { type: table[i].DependecyType };
    if(table[i].Param1) { dep.param1 = table[i].Param1; }
    if(table[i].Param2) { dep.param2 = table[i].Param2; }
    currentTask.dependencies.push(dep);
  }
  if(currentTask) { config.tasks.push(currentTask); }

  return config;
};








// source tab Module_CCPOConfigClass.gs
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








// source tab Module_CCPODatabaseClass.gs
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








// source tab Library_DateUtils.gs

var CCPODateUtils=new CCPODateUtilsClass ();

function test__CCPODateUtils ()
{
  var today=new Date();

  for(var i=0;i<10;i++)
  {
    Logger.log("today+"+i+"="+CCPODateUtils.asDateString(today));
    Logger.log("getDate="+(today.getDay()));
    Logger.log("isWorkingDay="+CCPODateUtils.isWorkingDay(today));
    Logger.log("makeWorkingDay="+CCPODateUtils.asDateString( CCPODateUtils.makeWorkingDay(today)));
    today=CCPODateUtils.addDays(1,today);
  }
}

//**************************************************
//**************************************************
function CCPODateUtilsClass ()
{
  var month = new Array();
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";

  //**************************************************
  // Returns <0 if date1<date2, >0 if date2>date1, and 0 if they are equal
  this.compareDates=function (date1,date2)
  {
    if (!date1)
      return (!date2)?0:-1;
    if (!date2)
      return 1;
    return date1.getTime()-date2.getTime();
  }


  //**************************************************
  this.addDays=function(daysToAdd,date)
  {
    var ret = new Date(date||new Date());
    ret.setDate(ret.getDate() + daysToAdd);
    return ret;
  }

  //**************************************************
  this.makeWorkingDay=function (date)
  {
    var weekday=date.getDay();
    if (weekday==6)  //Saturday
      return this.addDays(2,date);
    else if (weekday==0) //Sunday
      return this.addDays(1,date);
    else
      return date;
  }

  //**************************************************
  this.isWorkingDay=function (date)
  {
    if (!date) date=new Date();
    var weekday=date.getDay();
    if (weekday==0) //Sunday
      return false;
    else if (weekday==6) //Saturday
      return false;
    else
      return true;
  }

  //**************************************************
  this.findWeekday=function (weekday,date)
  {
    weekday=weekday%7;
    var ret = new Date(date||new Date());
    var daysToAdd=(weekday - 1 - ret.getDay() + 7) % 7 + 1;
    if (daysToAdd>0 && daysToAdd<7)
      ret.setDate(ret.getDate() + daysToAdd);
    return ret;
  }

  //**************************************************
  this.getWeekOfYear=function(date_)
  {
    var date = new Date(date_);
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  //**************************************************
  this.asDateString=function(currentDate)
  {
    if (!currentDate) return;
    var result= currentDate.getFullYear()+ String("0" + (currentDate.getMonth()+1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
    //Logger.log(result + ":"+currentDate);
    return result;
  }

  //**************************************************
  this.asDateString=function(currentDate)
  {
    if (!currentDate) return;
    var result= currentDate.getFullYear()+ String("0" + (currentDate.getMonth()+1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
    //Logger.log(result + ":"+currentDate);
    return result;
  }

  //**************************************************
  this.asShortString=function(currentDate)
  {
    if (!currentDate) return;
    var result= String("0" + currentDate.getDate()).slice(-2)+"-"+month[currentDate.getMonth()];
    //Logger.log(result + ":"+currentDate);
    return result;
  }
}
