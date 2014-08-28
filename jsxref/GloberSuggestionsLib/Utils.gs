/************************************************************/
function computeMap(sourceSheet, keyHeaderName,functionToCall) {
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

function clean(obj){
  var result = null;
  if(obj)
    result = obj.toString().toUpperCase().trim();
  return result;
}

function testStripHashTag() {
  log(stripHashTag("10000.00"));
}


function log(msg) {
  Logger.log(msg);
}

/************************************************************/
function saveLog(logSheet) {
  logSheet.getRange(logSheet.getLastRow()+1,1).setValue(Logger.getLog());
  //Logger.clear();
}


/************************************************************/
function clearSheet(sheet) {
  sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).clearContent();
}

/************************************************************/
function getDataFromSheet(sheet, row, column, numRows, numColumns) {
  row = row || 2;
  column = column || 1;
  numRows = numRows || sheet.getLastRow();
  numColumns = numColumns || sheet.getLastColumn()
  return sheet.getRange(row, column, numRows, numColumns).getValues();
}

/**************************************************/
/**************************************************/
/**************************************************/
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

/**************************************************/
/**************************************************/
/**************************************************/
function assert(c,msg)
{
  if (!c)
    log(msg);
  //throw msg;
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
function getRowObject(origSheet,rowNumber,headers)
{
  var cont;
  var rowObj={};
  var rowValues=origSheet.getRange(rowNumber,1,1,origSheet.getMaxColumns()).getValues();
  
  for(cont=0;cont<headers.length;cont++)
  {
    var column=findColumnByHeader(origSheet, headers[cont]);
    if (column<0) continue; //not found!
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
function getSortedRows(sheet, sortByColumnName, sortAscending)
{
  var cont;
  Logger.log(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var numRows = sheet.getLastRow()-1;
  var numColumns = sheet.getLastColumn();
  Logger.log(numRows);
  Logger.log(numColumns);
  var allValuesRange = sheet.getRange(2, 1, numRows, numColumns);
  
  var sortParams = [];
  var sortByColumnNdx = findColumnByHeader(sheet, sortByColumnName);
  if( sortAscending == undefined ) {
    sortAscending = true;
  }
  allValuesRange.sort({column: sortByColumnNdx, ascending: sortAscending});
  
  
  var AllValues = allValuesRange.getValues();
  var allRows=new Array(AllValues.length-1);
  
  for(i=1;i<AllValues.length;i++)
  {
    var row=AllValues[i];
    var rowObj={};
    rowObj.rowID=i+1;
    for(cont=0;cont<row.length;cont++)
    {
      rowObj[headers[cont]]=row[cont];
    }
    allRows[i-1]=rowObj;   
  }
  
  return allRows;
}

/**********************************************************/
function getRows(sheet)
{
  var cont;
  var AllValues=sheet.getDataRange().getValues();
  var allRows=new Array(AllValues.length-1);
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
    allRows[i-1]=rowObj;   
    
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
function copySheet(sourceSheet,destSheet)
{
  var values=sourceSheet.getDataRange().getValues();
  destSheet.clear();
  destSheet.getRange(1,1,values.length,values[0].length).setValues(values);
}

/******************************************************/
function copyFormulasAtTheEndOfSheet(sheet,startColumn,endColumn)
{
  //get the formulas to copy from the 2nd row
  var formulas=sheet.getRange(2, startColumn, 1,endColumn-startColumn+1).getFormulasR1C1();

  //Find the rows to copy formulas to   
  var firstColumnRange=sheet.getRange(1, startColumn, sheet.getLastRow(),1) ;
  var firstColumnValues=firstColumnRange.getValues();

  //look for a non-empty value starting from below going up
  for(var i=firstColumnValues.length-1;i>=0;i--)
  {
    if (firstColumnValues[i][0]) //check for empty
      break; //found something in the row!
  }
  
  i++; //first empty value is the row below the non-empty one
  
  var rowsToCopyFormulasTo=firstColumnValues.length-i;
  if (rowsToCopyFormulasTo==0) 
    return; //nothing to copy
  
  var formulasToCopy=new Array(rowsToCopyFormulasTo);
  for(var j=0;j<rowsToCopyFormulasTo;j++)
    formulasToCopy[j]=formulas[0];
    
  var whereToCopyFormulasRange=sheet.getRange(i+1, startColumn, rowsToCopyFormulasTo,endColumn-startColumn+1);
  whereToCopyFormulasRange.setFormulasR1C1(formulasToCopy);
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

/******************************************************/
function toLowerCase(str) {
  var key = "";
  for (var i = 0; i < str.length; ++i) {
    var letter = str[i];
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    key += letter.toLowerCase();
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

/**************************************************/
function stripHashTag(string)
{
  if( string != undefined )
    return String(string).split("#").join("");
  
  return string;
}
/**************************************************/
function prepareKey(strKey) 
{
  if (strKey)
    return strKey.toLocaleUpperCase().trim();
};

