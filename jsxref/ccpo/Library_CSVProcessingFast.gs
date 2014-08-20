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
