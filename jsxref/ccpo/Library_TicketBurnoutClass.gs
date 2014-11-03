
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
function getHolidaysARSheet() { return getTBOTicketBurnoutSpreadsheet().getSheetByName("Holidays AR"); }

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
    reportDate: new Date(),
    expectedTicketsPerDay: 20
  };
  this.config = {};

  var errorList = new CCPOErrorListClass(); // collect error messages and email them
  var CCPODateUtils = new CCPODateUtilsClass(); // used for week calcultations

  // merge options into defaults giving config
  this.config = new Settings( defaults, options );
  if( ! this.config.reportWeek ) { this.config.reportWeek = CCPODateUtils.getWeekOfYear( this.config.reportDate ); }
  // this day1Date should be incremented by 1 or 2 whenever the week starts in the weekend
  this.config.day1Date = new Date(this.config.reportDate.getFullYear(), this.config.reportDate.getMonth(), 1); 
  this.config.day1Week = CCPODateUtils.getWeekOfYear( this.config.day1Date ); 
  this.config.reportStartWeek = this.config.day1Week + ( ( ( this.config.day1Week.getDay() + 6 ) % 7 ) > 4 ? 1 : 0 );
  this.config.reportWeek = CCPODateUtils.getWeekOfYear( this.config.reportDate ); 
  this.config.reportDayOfWeek = ( this.config.reportDate.getDay() + 6 ) % 7; // Monday = 0
  this.config.reportMonday = CCPODateUtils.getWeekOfYear( this.config.reportDate ); 
  this.config.test = isARHoliday( this.config, this.config.reportDate ); 
  
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
  
  // build the daily tickets target column
  var accumTarget = [0, 0, 0, 0, 0], reportWeekDay = 5;
  
  
  
/*  
{ name:'B5-Monday', row:5, col:2, n:0, isTarget:true, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && ! isARHoliday( r.date ) ) } },
{ name:'B6-Monday', row:6, col:2, n:0, isTarget:true, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && ! isARHoliday( r.date ) ) } },
{ name:'B7-Monday', row:7, col:2, n:0, isTarget:true, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && ! isARHoliday( r.date ) ) } },
{ name:'B8-Monday', row:8, col:2, n:0, isTarget:true, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && ! isARHoliday( r.date ) ) } },
{ name:'B9-Monday', row:9, col:2, n:0, isTarget:true, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && ! isARHoliday( r.date ) ) } },
*/
  

  acumRules = [
{ name:'E5-Onsite staffed', row:5, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && r.isOnSite ); } },
{ name:'E6-Onsite staffed', row:6, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && r.isOnSite ); } },
{ name:'E7-Onsite staffed', row:7, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && r.isOnSite ); } },
{ name:'E8-Onsite staffed', row:8, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && r.isOnSite ); } },
{ name:'E9-Onsite staffed', row:9, col:5, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && r.isOnSite ); } },

{ name:'F5-Hired', row:5, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'F6-Hired', row:6, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'F7-Hired', row:7, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'F8-Hired', row:8, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'F9-Hired', row:9, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },

{ name:'G5-Staffed', row:5, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 0 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'G6-Staffed', row:6, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 1 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'G7-Staffed', row:7, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 2 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'G8-Staffed', row:8, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek === 3 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'G9-Staffed', row:9, col:7, n:0, condition: function(r){ return( r.isInThisWeek && r.dayOfWeek >= 4 && ! r.isHired && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },

{ name:'F12-StaffHired', row:12, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isGlobant ); } },
{ name:'G12-StaffStaffed', row:12, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isGlobant ); } },
{ name:'F13-ShadowHired', row:13, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isShadow && ! r.isGlobant ); } },
{ name:'G13-ShadowStaffed', row:13, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isShadow && ! r.isGlobant ); } },
{ name:'F14-ReplacementHired', row:14, col:6, n:0, condition: function(r){ return( r.isInThisWeek && r.isHired && r.isReplacement && r.isConfirmed && ! r.isGlobant ); } },
{ name:'G14-ReplacementStaffed', row:14, col:7, n:0, condition: function(r){ return( r.isInThisWeek && ! r.isHired && r.isReplacement && r.isConfirmed && ! r.isGlobant ); } },

// Chart 2 monthly acum
{ name:'E18-Onsite', row:18, col:5, n:0, condition: function(r){ return( ! (r.date < r.config.day1Date) && ! r.isReplacement && r.isConfirmed && ! r.isGlobant && r.isOnSite ); } },
{ name:'D18-Staffed', row:18, col:4, n:0, condition: function(r){ return( (! r.date < r.config.day1Date) && ! r.isHired && ! r.isReplacement && r.isConfirmed && ! r.isGlobant ); } },
{ name:'C18-Hired', row:18, col:3, n:0, condition: function(r){ return( ! (r.date < r.config.day1Date) && r.isHired && ! r.isReplacement && r.isConfirmed && ! r.isGlobant ); } },

// weekly evolution chart: week# = r.ticketWeekNum - this.config.day1Week      r.weekOfMonth
// Por semana calendario, contar los tickets con: H-Client ≠ “Globant” L-Replacement = “No” J-Type of Position = “CONFIRMED”? yes
{ name:'B45-Week1', row:45, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 0 && ! (r.date < r.config.day1Date)  && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'B46-Week3', row:46, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 1 && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'B47-Week3', row:47, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 2 && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'B48-Week4', row:48, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 3 && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'B49-Week5', row:49, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 4 && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },
{ name:'B50-Week6', row:50, col:3, n:0, condition: function(r){ return( r.weekOfMonth === 5 && ! r.isGlobant && ! r.isReplacement && r.isConfirmed ); } },

// a counter of all tickets; triggers debug output
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
  
  function calculateAdditionalData( config, r ){ 
  // adds calculated properties to r, the current-ticket row
    r.config = config; // pass a ref to config within r
    r.date = parseARDate( r['Hire/Staffed Date'] );  // dates come in dd/mm/yy hh:mm format
    r.ticketWeekNum = CCPODateUtils.getWeekOfYear( r.date );
    r.isInThisWeek = ( config.reportWeek === r.ticketWeekNum );
    // Logger.log( 'date:' + r.date + ' day1Week:' + config.day1Week + ' weekNum:' + r.ticketWeekNum + ' wom:' + r.weekOfMonth );
    r.dayOfWeek = ( r.date.getDay() + 6 ) % 7; // day of week: 0 represents Monday
    r.isOnSite = r['Work Office'].substr(0, 2) === 'EU' || r['Work Office'].substr(0, 2) === 'UK';
    r.isShadow = ( r['Type of Position'] === 'SHADOW' );
    r.isConfirmed = ( r['Type of Position'] === 'CONFIRMED' );
    r.isProposed = ( r['Type of Position'] === 'PROPOSED' );
    r.isHired = ( r.Status === 'Hired' );
    r.isGlobant = ( r.Client === 'Globant' );
    r.isReplacement = ( r['Replacement'] === 'Yes' );
    r.isDateInMonth = ( r.date >= config.day1Date );
    r.weekOfMonth = r.ticketWeekNum - config.reportStartWeek; // 0, 1, 2, 3, 4
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
    if( this.config.debug ) { Logger.log( aRule.name + ' (' + aRule.row + ', ' + aRule.col + '): ' + aRule.n ); }
    TBONumbersSheet.getRange( aRule.row, aRule.col ).setValue( aRule.n ); 
  };

  // calculate the charts
  // ...
  // email the report to the recipients list
  // ...

  function lz( dayOrMonth ) {
  // prepend left zero to one-digit day or month numbers
    var domStr = '' + dayOrMonth;
    if( domStr.length === 1 ) { return '0' + domStr; } else { return domStr; }
  };
  
  function editDateYYYYMMDD( theDate ) {
    return '' + theDate.getFullYear() + lz(theDate.getMonth() + 1) + lz(theDate.getDate());
  }
  
  function isARHoliday( config, date ) {
    if( ! config.hasOwnProperty( 'holidaysAR' ) ) {
      var holidaysARSheet = getHolidaysARSheet();
      assert( holidaysARSheet, "The Argentina many holidays sheet is not available" );
      var holidaysARRows = getRows( holidaysARSheet );
      config.holidaysAR = [];
      for( var ih = 0; ih < holidaysARRows.length; ih++ ) {
        var theDate = holidaysARRows[ih].date;
        config.holidaysAR.push( editDateYYYYMMDD( theDate ) );
        if( config.debug ) { Logger.log( 'Holiday #' + ih + ' ' + theDate.toDateString() + ' ' + editDateYYYYMMDD( theDate ) + ' ' + holidaysARRows[ih].name ); }
      }
    }
    return( config.holidaysAR.indexOf( date.getTime() >= 0 ) );
  };

  
  return this;
}


