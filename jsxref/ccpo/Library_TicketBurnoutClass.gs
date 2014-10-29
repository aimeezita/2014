
function shootTicketBurnout(){
  var options = {
    reportRecipients: 'juan.lanus@globant.com',
    reportDate: isoToDate( '2014-10-28' ),
    debug: true
  };

  // instantiate and run the reporter
  var TBO = new TicketBurnoutClass( options );
  assert( TBO, 'Ticket Burnout Report not starting' );

}


// FOR: Library_CCPOFileFinder
/**************************************************************************************************/
/************************************* Ticket Burnout Report **************************************/
/****************************************** prefix: TBO *******************************************/
function getTBOTicketBurnoutSpreadsheet() { return getSpreadsheetHandler( '0An-jcFMxy8_ydENXRlNEeWFRRzNCaVJpdzJGQUY4RVE', 'Ticket Burnout Report data' ) };
function getTBOTicketsDataSheet() { return getTBOTicketBurnoutSpreadsheet().getSheetByName("TicketsData"); }
function getTBONumbersSheet() { return getTBOTicketBurnoutSpreadsheet().getSheetByName("TBO numbers"); }

/******************************************** utilities *******************************************/
function isoToDate(dateStr){
// argument = date string iso 8601 format, returns Date object
  var str = dateStr.replace(/-/,'/').replace(/-/,'/').replace(/T/,' ').replace(/\+/,' \+').replace(/Z/,' +00');
  return new Date(str);
}

function parseARDate( dateString ) {
// parses a dd/mm/yy or dd/mm/yyyy date, discarding tine info if any,
// returns a Date object, assumes the data is in good shape, S XXI
  var part = dateString.split( ' ' );  // separate time
  var part = part[0].split( '/' );     // split d m y
  if( part[2].length !== 4 ) { part[2] = '20' + part[2] };
  var d = new Date( part[2] + '/' + part[1] + '/' + part[0] );
  if( isNaN( d.getTime() ) ) { throw( 'Bad date ' + dateString ); }
  return d;
}


/******************************************* the reorter ******************************************/
function TicketBurnoutClass( options ) {
// builds the "Ticket burnout" report and emails it    

  defaults = { // don`t change this, use the options argument
    reportRecipients: 'nicolas.gerpe@globant.com, juan.lanus@globant.com',
    errorMessagesRecipients: 'nicolas.gerpe@globant.com, juan.lanus@globant.com',
    reportDate: new Date()
  };
  settings = {};

  var errorList = new CCPOErrorListClass(); // collect error messages and email them
  var CCPODateUtils = new CCPODateUtilsClass(); // used for week calcultations

  // merge options into defaults giving settings
  this.config = new Settings( defaults, options );
  if( ! this.config.reportWeek ) { this.config.reportWeek = CCPODateUtils.getWeekOfYear( this.config.reportDate ); }
  this.config.day1Date = new Date(this.config.reportDate.getFullYear(), this.config.reportDate.getMonth(), 1);
  this.config.day1Week = CCPODateUtils.getWeekOfYear( this.config.day1Week ); 
  
  // get a reference to the ticket burnout workbook
  var TBOTicketBurnoutSpreadsheet = getTBOTicketBurnoutSpreadsheet();
  assert( TBOTicketBurnoutSpreadsheet, 'Ticket Burnout Report data not available' );
  
  // reference the input spreadsheet containing the burned tickets
  var TBOTicketsDataSheet = getTBOTicketsDataSheet();
  assert( TBOTicketsDataSheet, 'The tickets data sheet is not available' );
  var ticketsDataSheetRows = getRows( TBOTicketsDataSheet );

  // reference to the output tabular report
  var TBONumbersSheet = getTBONumbersSheet();
  assert( TBONumbersSheet, 'The numbers output sheet is not available' );

  acumRules = [
{ name:'E5-Onsite staffed', row:5, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && r.isOnSite ); } },
{ name:'E6-Onsite staffed', row:6, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && r.isOnSite ); } },
{ name:'E7-Onsite staffed', row:7, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && r.isOnSite ); } },
{ name:'E8-Onsite staffed', row:8, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && r.isOnSite ); } },
{ name:'E9-Onsite staffed', row:9, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && r.isOnSite ); } },

{ name:'F5-Hired', row:5, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'F6-Hired', row:6, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'F7-Hired', row:7, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'F8-Hired', row:8, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'F9-Hired', row:9, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },

{ name:'G5-Staffed', row:5, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'G6-Staffed', row:6, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'G7-Staffed', row:7, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'G8-Staffed', row:8, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },
{ name:'G9-Staffed', row:9, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && ! r.isShadow ); } },

{ name:'F12-StaffHired', row:12, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isGlobant ); } },
{ name:'G12-StaffStaffed', row:12, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isGlobant ); } },
{ name:'F13-ShadowHired', row:13, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isShadow && ! r.isGlobant ); } },
{ name:'G13-ShadowStaffed', row:13, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isShadow && ! r.isGlobant ); } },
{ name:'F14-ReplacementHired', row:14, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isReplacement && ! r.isShadow && ! r.isGlobant ); } },
{ name:'G14-ReplacementStaffed', row:14, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isReplacement && ! r.isShadow && ! r.isGlobant ); } },

// Chart 2 monthly acum
{ name:'E18-Onsite', row:18, col:5, n:0, condition: function(r){ return( ! r.isReplacement && ! r.isShadow && ! r.isGlobant && r.isOnSite ); } },
{ name:'D18-Staffed', row:18, col:4, n:0, condition: function(r){ return( ! r.isHired && ! r.isReplacement && ! r.isShadow && ! r.isGlobant && ! r.isOnSite ); } },
{ name:'C18-Hired', row:18, col:3, n:0, condition: function(r){ return( r.isHired && ! r.isReplacement && ! r.isShadow && ! r.isGlobant && r.isOnSite ); } },

// a counter of all tickets, triggers debug output
{ name:'Z99 all', row:14, col:1, n:0, condition: function(r){ return( true ); } } // DEBUG: all tickets in input
  ];

  function count( config, ticketRow ){
    var r = ticketRow;
    calculateAdditionalData( config, r );
    for( iar = 0; iar < acumRules.length; iar++ ){
      var aRule = acumRules[iar];
      if( aRule.condition( r ) ) { 
	aRule.n++; 
	if( config.debug ) {
          if( ! r.countedIn ) { r.countedIn = ''; }
          if( aRule.name === 'Z99 all') {
            Logger.log( '  ticket:' + r.Number + ' ' + r.Status + ' ' + r.Client + ' ' + r['Type of Position']
            + ' ' + r['Work Office'].substr(0, 2) + ' replacement:' + r.Replacement + ' date:'
            + r['Hire/Staffed Date'].substr(0, 5) + ' +:' + r.countedIn );
          } else {
            r.countedIn += aRule.name + ' ';
          }
	}
      }
    };
  };
  
  function calculateAdditionalData( config, r ){ // add r a few properties
    var hsd = parseARDate( r['Hire/Staffed Date'] );  // dates come in dd/mm/yy hh:mm format
    r.date = hsd; // same date, no time
    r.ticketWeekNum = CCPODateUtils.getWeekOfYear( hsd );
    r.isInThisWeek = ( config.reportWeek === r.ticketWeekNum );
    r.dayOfWeek = ( hsd.getDay() + 6 ) % 7; // day of week: 0 represents Monday
    r.isOnSite = r['Work Office'].substr(0, 2) === 'EU' || r['Work Office'].substr(0, 2) === 'UK';
    r.isShadow = ( r['Type of Position'] === 'SHADOW' );
    r.isHired = ( r.Status === 'Hired' );
    r.isGlobant = ( r.Client === 'Globant' );
    r.isReplacement = ( r['Replacement'] === 'Yes' );
  };
  
  //-------------------------- START HERE -----------------------------
  // loop over the tickets counting the cases
  var n = 0;
  for( var i = 0; i < ticketsDataSheetRows.length; i++ ) {
    count( this.config, ticketsDataSheetRows[i] );
    n++;
  };
  Logger.log( 'Rows counted: ' + n );

  // set the results onto the output spreadsheet TBONumbersSheet
  for( iar = 0; iar < acumRules.length; iar++ ){
    aRule = acumRules[iar];
    if( settings.debug ) { Logger.log( aRule.name + ': ' + aRule.n ); }
    TBONumbersSheet.getRange( aRule.row, aRule.col ).setValue( aRule.n ); 
  };

  // calculate the charts
  // ...
  // email the report to the recipients list
  // ...
  
  return this;
}








