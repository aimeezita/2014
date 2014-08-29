// Contains all the bench data, answers if a glober is in the bench
// or not, since when, and the like

// constructor: loads the data once
function Bench( benchSheetName ) {
  // get a ref to the bench sheet, load a headers and a data array
  var bs = getPublicBenchSheet();
  this.available = getRows( bs );
  this.availableHeaders = bs.getRange(1, 1, 1, bs.getLastColumn()).getValues();

  // find the "Email" column and build a map from emails to row numbers
  COL_EMAIL = this.availableHeaders.indexOf( 'Email' );
  if( ! this.COL_EMAIL >= 0 ) {
    throw "Did not find en "Email" col header in the "Available" sheet';
  }
  this.index = {};
  for( var i = 0; i < this.available.length; i++ ) {
    this.index[ this.available[COL_EMAIL]] = i;
  }


}

Bench.prototype = {

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
