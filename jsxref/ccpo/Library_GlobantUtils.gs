/******************************************************************************/
function assert(c, msg) {
  if (!c)
    throw msg;
}
/******************************************************************************/
function compareStrings(str1, str2) {
  if (isEmptyString(str1))
    return isEmptyString(str2)?0:-1;
  if (isEmptyString(str2))
    return 1;
  if (str1<str2) return -1;
  if (str1>str2) return 1;
  return 0;
}
/******************************************************************************/
function compareDates(date1, date2) {
  if (!date1)
    return (!date2)?0:-1;
  if (!date2)
    return 1;
  return date1.getTime()-date2.getTime();
}
/******************************************************************************/
function obfuscateString(str) {
  if (isEmptyString(str)) return "";
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, str, Utilities.Charset.US_ASCII);
  return Utilities.base64Encode(digest).substr(0, 50).toLowerCase();
}
/******************************************************************************/
function isEmptyString(str) {
  if (!str) return true;
  return 0===str.length || ""===str.trim();
}
/******************************************************************************/
function convertDictionaryToArray(values) {
  var resultArray = [];
  for (var key in values) {
    var value = values[key];
    if (value)
      resultArray.push(value);
  }
  return resultArray;
}
/******************************************************************************/
function ensureMinimumSize(destSheet, rows, columns) {
  if (destSheet.getMaxRows()<rows)
    destSheet.insertRows(destSheet.getMaxRows(), rows-destSheet.getMaxRows());
  if (destSheet.getMaxColumns()<columns)
    destSheet.insertColumns(destSheet.getMaxColumns(), columns-destSheet.getMaxColumns());
}
/******************************************************************************/
function cloneSimpleObject(obj) {
  var clone = {};
  for(var i in obj) {
    if(typeof(obj[i])=="object" && obj[i] != null)
      clone[i] = cloneObject(obj[i]);
    else
      clone[i] = obj[i];
  }
  return clone;
}
/******************************************************************************/
function copyColumns(origSheet, destSheet, ColumnsToCopy) {
  destSheet.clear()
  var cont;
  for(cont = 0;cont<ColumnsToCopy.length;cont++) {
    var column = findColumnByHeader(origSheet, ColumnsToCopy[cont]);
    if (column<0) continue; //not found!
    copyColumn (origSheet, destSheet, column, cont + 1)
  }
  SpreadsheetApp.flush();
}
/******************************************************************************/
function findColumnByHeader (sheetObject, header) {
  var lastCol = sheetObject.getLastColumn();
  var headers = sheetObject.getRange(1, 1, 1, lastCol).getValues()[0];
  var cont;
  for(cont = 0;cont<lastCol;cont++) {
    if (headers[cont]==header)
      return cont + 1;
  }
  Browser.msgBox("'" + header  + "' header not found!");
  return -1;
}
/******************************************************************************/
function copyColumn (origSheetObject, destSheetObject, origColNumber, destColNumber) {
  var origLastRow = origSheetObject.getLastRow();
  var origRange = origSheetObject.getRange(1, origColNumber, origLastRow, 1)
  var destRange = destSheetObject.getRange(1, destColNumber, origLastRow, 1);
  //origRange.copyTo(destRange);
  var values = origRange.getValues();
  destRange.setValues(values);
  //var formulas = origRange.getFormulas();
  //destRange.setFormulas(formulas);
  //Copio formato header
  origRange = origSheetObject.getRange(1, origColNumber, 1, 1)
  destRange = destSheetObject.getRange(1, destColNumber, 1, 1);
  destRange.setBackground(origRange.getBackground()) ;
  destRange.setFontStyle(origRange.getFontStyle()) ;
  destRange.setFontWeight(origRange.getFontWeight()) ;
}
/******************************************************************************/
function getCellValue(sheet, rowNumber, colNumber) {
  return sheet.getRange(rowNumber, colNumber).getValue();
}
/******************************************************************************/
function setCellValue(sheet, rowNumber, colNumber, value) {
  return sheet.getRange(rowNumber, colNumber).setValue(value);
}
/******************************************************************************/
function getHeaderIndexes(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headerIdx = {};
  for(var cont = 0;cont<headers.length;cont++) {
    headerIdx[headers[cont]] = cont + 1;
  }
  return headerIdx;
}
/******************************************************************************/
function getSheetHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return headers;
}
/******************************************************************************/
function getRowObject(origSheet, rowNumber, headers) {
  var cont;
  var rowObj = {};
  var rowValues = origSheet.getRange(rowNumber, 1, 1, origSheet.getMaxColumns()).getValues();
  for(cont = 0;cont<headers.length;cont++) {
    var column = findColumnByHeader(origSheet, headers[cont]);
    if (column<0) continue; //not found!
    //Logger.log((headers[cont] + ":" + rowValues[0][column-1]));
    rowObj[headers[cont]] = rowValues[0][column-1];
  }
  return rowObj;
}
/******************************************************************************/
function getRowsWithHeaders(origSheet, headers) {
  var cont;
  var AllValues = origSheet.getDataRange().getValues();
  var allRows = new Array(AllValues.length);
  var headerIdx = {};
  for(cont = 0;cont<headers.length;cont++) {
    var idx = findColumnByHeader(origSheet, headers[cont]);
    headerIdx[cont] = idx;
    if (headerIdx[cont]<0)
      throw ("Header not found:" + headers[cont]);
  }
  for(i = 0;i<AllValues.length;i++) {
    var row = AllValues[i];
    var rowObj = {};
    for(cont = 0;cont<headers.length;cont++) {
      var column = headerIdx[cont]
      rowObj[headers[cont]] = row[column-1];
    }
    allRows[i] = rowObj;
  }
  return allRows;
}
/******************************************************************************/
/* filterFunction: can be null. rows where filterFunction(row) return false wont be returned */
function getRows(sheet, filterFunction) {
  var i;
  var AllValues = sheet.getDataRange().getValues();
  var allRows = new Array();
  var headers = AllValues[0];
  for( i = 1; i < AllValues.length; i++ ) {
    var row = AllValues[i];
    var rowObj = {};
    rowObj.rowID = i + 1;
    for( i = 0; i < row.length; i++ ) {
      rowObj[headers[i]] = row[i];
    }
    if ( filterFunction ) {
      if ( filterFunction( rowObj )) {
	allRows.push( rowObj );
      }
    }
  }
  return allRows;
}
/******************************************************************************/
function lookForValueInRows(valueToLookFor, rowValues, rowHeader) {
  for(var j = 0;j<rowValues.length;j++) {
    var theRow = rowValues[j];
    var theRowValue = theRow[rowHeader];
    if(theRowValue == valueToLookFor)
      return j;
  }
  return -1;
}
/******************************************************************************/
function lookForValuesInRows(valuesToLookFor, rowValues, rowHeaders) {
  for(var j = 0;j<rowValues.length;j++) {
    var theRow = rowValues[j];
    for(var i = 0;i<rowHeaders.length;i++) {
      var theRowValue = theRow[rowHeaders[i]];
      if(theRowValue != valuesToLookFor[i]) {
        break;
      }
    }
    if (i==rowHeaders.length) return j;
  }
  return -1;
}
/******************************************************************************/
function replaceText(msgBody, tags, data) {
  for (var i = 0; i < tags.length; i++) {
    // format tag
    var str_src = "##" + tags[i] + "##";
    var str_dest = data[i];
    //Browser.msgBox(str_src)
    //Browser.msgBox(str_dest)
    msgBody = msgBody.split(str_src).join(str_dest);
  }
  return msgBody;
}
/******************************************************************************/
function copySheet(sourceSheet, destSheet, step) {
/*
this is the code without doing de copy in chunks.
doesnt work well with big arrays
  var values = sourceSheet.getDataRange().getValues();
  destSheet.clear();
  destSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  SpreadsheetApp.flush();
*/
  Logger.log("Utils.copySheet function: Copying from: " + sourceSheet.getName());
  saveSheetValues(sourceSheet.getDataRange().getValues(), destSheet, step)
}
/******************************************************************************/
function saveSheetObjs(headers, rows, destSheet, step, appendToEnd) {
  if (!rows || rows.length<1) return;
  var values = [headers];
  if (appendToEnd)
    values = []; //no headers if adding at the end
  for(var i = 0;i<rows.length;i++) {
    var row = rows[i];
    var insertRow = [];
    for(var j = 0;j<headers.length;j++) {
      insertRow.push(row[headers[j]]);
    }
    values.push(insertRow);
  }
  saveSheetValues(values, destSheet, step, appendToEnd);
}
/******************************************************************************/
function saveSheetValues(values, destSheet, step, appendToEnd) {
  var startingRow = 1;
  if (appendToEnd)
    startingRow = 1 + destSheet.getLastRow();
  else
    destSheet.clear();
  Logger.log("Utils.saveSheetValues function: Copying to " + destSheet.getName());
  var chunk = step?step:1000;
  var position, totalLength, temparray;
  for (position = 0, totalLength = values.length; position<totalLength; position += chunk) {
    temparray = values.slice(position, position + chunk);
    destSheet.getRange(startingRow + position, 1, temparray.length, values[0].length).setValues(temparray);
    SpreadsheetApp.flush();
  }
  Logger.log("Utils.saveSheetValues function: End copy");
}
/******************************************************************************/
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
/******************************************************************************/
function copyFormat(origRange, destRange) {
  destRange.setBackground(origRange.getBackground()) ;
  destRange.setFontStyle(origRange.getFontStyle()) ;
  destRange.setFontWeight(origRange.getFontWeight()) ;
}
/******************************************************************************/
function stripHashTag(string) {
  if( string != undefined )
    return string.split("#").join("");
  return string;
}
function testStripHashTag() {
  Logger.log(stripHashTag("1234"));
  Logger.log(stripHashTag("##1234"));
}
/******************************************************************************/
function toUpper(str){
  var result = str;
  if (str){
    result = str.toLocaleUpperCase().trim();
  }
  return result;
}
/******************************************************************************/
function toLower(str){
  var result = str;
  if (str){
    result = str.toLowerCase().trim();
  }
  return result;
}
/******************************************************************************/
function quitSpaces(str){
  var result = str;
  if (str && str.indexOf(" ") >= 0){
    result = str.replace(" ", "");
  }
  return result;
}
/******************************************************************************/
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
/******************************************************************************/
function addDaysToDate(daysToAdd, date) {
  var ret = new Date(date||new Date());
  ret.setDate(ret.getDate() + daysToAdd);
  return ret;
}
/******************************************************************************/
function findWeekday(weekday, date) {
  weekday = weekday%7;
  var ret = new Date(date||new Date());
  var daysToAdd = (weekday - 1 - ret.getDay() + 7) % 7 + 1;
  if (daysToAdd>0 && daysToAdd<7)
    ret.setDate(ret.getDate() + daysToAdd);
  return ret;
}
/******************************************************************************/
function getDateWeek(date_) {
  var date = new Date(date_);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}
/******************************************************************************/
function normalizeDate(currentDate) {
  if (!currentDate) return;
  var result =  currentDate.getFullYear()+ String("0" + (currentDate.getMonth() + 1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
  //Logger.log(result + ":" + currentDate);
  return result;
}
/******************************************************************************/
function computeMap(sourceSheet, keyHeaderName, functionToCall) {
  Logger.log("Computing map:" + sourceSheet.getName());
  var rows = getRows(sourceSheet);
  var map = {};
  for(var i = 0;i<rows.length;i++) {
    var row = rows[i];
    var key = row[keyHeaderName];
    if (functionToCall)      functionToCall(row);
    map[key] = row;
  }
  Logger.log("End Computing map:" + sourceSheet.getName() + ": " + Object.keys(map).length);
  return map;
}
/******************************************************************************/
function hasElapsedEnoughTime(processName, millisBetweenLastTime) {
  processName = "hasElapsedEnoughTime__" + processName;
  var lastTime  =  PropertiesService.getUserProperties().getProperty(processName);
  if (!lastTime )
    lastTime = 0;
  var currentTime = new Date().getTime();
  if (currentTime-lastTime<millisBetweenLastTime)
    return false;
  PropertiesService.getUserProperties().setProperty(processName, currentTime);
  return true;
}
function testhasElapsedEnoughTime() {
  for (var i = 0;i<5;i++) {
    Logger.log(i);
    while(!hasElapsedEnoughTime("testhasElapsedEnoughTime", 1000*3)) {
      Utilities.sleep(500)
    }
  }
    Logger.log("end");
}
/******************************************************************************/
/*
TO DO: escape strings!
*/
function sendTableEmailFromObjs (subject, emailRecipients, values, headers, severalTables, titles) {
  if (!severalTables) {
    values = [values];
    headers = [headers];
  }
  var htmlTable = "<body><center><h2>" + subject + "</h2><br />\r\n";
  for(var i = 0;i<values.length;i++) {
    if (i>0)
      htmlTable += "<hr>";
    if (titles)
      htmlTable += "<h2>" + titles[i] + "</h2>";
    htmlTable += convertArrayToHTML(values[i], headers[i])
  }
  htmlTable += "\r\n</center></body>\r\n";
  GmailApp.sendEmail(emailRecipients, subject, "This is an HTML email", {htmlBody: htmlTable});
}
/******************************************************************************/
function convertArrayToHTML (values, headers) {
  var htmlTable = "<table border=1><tr>";
  for(var j = 0;j<headers.length;j++) {
    htmlTable += "<td>" + headers[j] + "</td>";
  }
  htmlTable += "</tr>\r\n";
  for(var i = 0;i<values.length;i++) {
    if (values[i].htmlRowBGColor)
      htmlTable += "<tr style='background-color: " + values[i].htmlRowBGColor + ";'>";
    else
      htmlTable += "<tr>";
    for(var j = 0;j<headers.length;j++) {
      htmlTable += "<td>" + values[i][headers[j]] + "</td>";
    }
    htmlTable += "</tr>\r\n";
  }
  htmlTable += "</table>";
  return htmlTable;
}
