function computeStaffingSuggestions_cron()
{
  Logger.log( 'Staffing suggestions calculation process' );
  var suggestionsConfig = 
  {
    // where the calculator will store the suggestions - reference to a writable sheet
    suggestionsSheet: getTestingSpreadsheet().getSheetByName( "StaffingSuggestions" ),
    // discard suggestions with matching below this value (0~100)
    minMatchingThreshold: 75,
    // send the errors log to the followong email(s) - separate with comma
    errorsEmailRecipients: 'juan.lanus@globant.com',
    // errorsEmailRecipients: 'dario.robak@globant.com',
    // other
    other: 'nothing'
  };
  var suggestionsSheet = getTestingSpreadsheet().getSheetByName( "StaffingSuggestions" );
  var suggestionsCalculator = new CCPOStaffingSuggestionsClass( suggestionsConfig );
  var minValue=75;
  suggestionsCalculator.initialize();
  suggestionsCalculator.computeSuggestions( suggestionsSheet, minValue );
  suggestionsCalculator.storeSuggestions( suggestionsSheet );
}


function CCPOStaffingSuggestionsClass( config )
{
  var // privates
    errorList,
    config,
    debug = true,
    ticketsSheet,
    ticketsRows,
    globerRows,
    availableRows, 
    availMap,
    seniorityMapper,
    locationMapper,
    englishLevelMapper,
    skillsEquivalenceMapper,
    resultValues
  ;
  var emailRecipient = 'dario.robak@globant.com';

  this.congif = config;

  /*************************************** set up *********************************************/
  // $$$$ this must be part of the constructor code
  this.initialize = function(suggestionsSheet, threshold) {
    errorList = new CCPOErrorListClass();
    errorList.clear();
    config = new CCPOConfigClass();

    // instantiate various mappers
    seniorityMapper = config.getMapper("Seniority");
    locationMapper = config.getMapper("Location");
    englishLevelMapper = config.getMapper("EnglishLevel");
    skillsEquivalenceMapper = config.getMapper("SkillsEquivalence");

    // load the Tickets and normalize them by overwriting the pertinent columns, the
    // tickets that have normalizing issues are deleted
    ticketsSheet = getBenchSpreadsheet().getSheetByName("Tickets");
    ticketsRows = getRows(ticketsSheet);
    ticketsRows = normalizeTickets( ticketsRows );

    // build a map of the Available sheet (bench) keyed by Email column
    availMap = computeMap(getBenchSpreadsheet().getSheetByName("Available"), "Email");

    // load the Globers data and normalize it
    var globerSheet = getBenchSpreadsheet().getSheetByName("Globers");
    globerRows = getRows(globerSheet);
    globerRows = normalizeGlobers( globerRows );

    // incorporate the newhires as normalized globers
    normalizeNewHires( globerRows );
  }

  /********************************************************************************************/
  // make normalized globers out of the newhires in the Available sheet and append them to
  // the globerRows array
  this.normalizeNewHires = function( globerRows ) {
    Logger.log( 'about to make normalized globers out of the newhires from Available' );

    // get the Available rows
    availableRows = getRows( getBenchSpreadsheet().getSheetByName("Available") );

    // loop over the Available rows making glober rows out of the hewhires
    for( var i = 0; i < availableRows.length; i++ ) {
      var ar = availableRows[i];
      if( ar['Email'] == 'NH' ) {
        // is a newhire: build the normalized fake glober row
        try 
	{
	  var gr = {
	    'Glober ID': ar['globerId'],
	    'First Name': ar['Name'],
	    'Last Name': '', 'Email': 'NH', 'Birthdate': '',
	    'Entry Date': ar['Bench Start Date'],
	    'Role': ar['Skill'],
	    'Seniority': ar['SeniorityRange'],
            'Seniority Range': normalizeSeniority(ar, 'SeniorityRange'),
	    'Seniority': ar['SeniorityRange'],
	    'LegalID': '',
	    'Glober Office': this.normalizeLocation( ar['Location'] ),
	    'Society': '',
	    'English level': normalizeEnglishLevel(ar, 'English'),
	    'Billable': '',
	    'Max Time Abroad': ar['canTravel'],
	    'Starting On': '', 'Argentine Passport': '', 'Arg Pass Expiration Date': '', 'European Passport': '',
	    'European Passport Expiration Date': '', 'US Passport': '', 'US Passport Expiration Date': '',
	    'US Visa': '', 'US VisaType.': '', 'US Visa Exp.': '', 'Organizational Unit': '', 'Upload CV': '',
	    'Last date skills review': '', 'Glober Studio': '', 'Staff': '',
	    'isAvailable': true,
	    'Bench Start Date': ar['Bench Start Date'],
	    'New Hire': 'NH'
	  };
          // append to the globers roster
          globerRows.push( gr );
        } catch(error) {
          Logger.log( 'Error normalizing newhire ' + ar['Name'] + ': ' + error );
          errorList.addError( error );
        }

      }
    }

    this.normalizeLocation = function( from )
    {
      var to = locationMapper.map( from );
      if( to != null ) 
      {
        return to;
      } else {
        throw( 'Location mapping error: ' + from );
      }
    }

    function normalizeSeniority(itemRow, itemName) {
      var from = itemRow[itemName];
      var to = seniorityMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        throw( 'Glober seniority mapping error: ' + from  );
      }
    }

    function normalizeEnglishLevel(itemRow, itemName) {
      var from = itemRow[itemName];
      if (!from || isEmptyString(from))
         return 0;
      var to = englishLevelMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        throw( 'Glober english level mapping error: ' + from );
      }
    }

  }
















  /********************************************************************************************/
  // normalize all the globers in globerRows, return an array with only the good ones
  function normalizeGlobers( globerRows ) {
    Logger.log( 'about to normalize ' + globerRows.length + ' globers' );
    var globersRowsOK = [];
    for( var i = 0; i < globerRows.length; i++ ) {
      try {
        var gr = globerRows[i];
        gr['Seniority Range'] = normalizeSeniority(gr, 'Seniority');
        gr['Glober Office'] = normalizeLocation(gr, 'Glober Office');
        gr['English level'] = normalizeEnglishLevel(gr, 'English level');
        var globerAvailable = availMap[gr['Email']];
        gr['isAvailable'] = false;
        if( !! globerAvailable ) {
          gr['New Hire'] = ( globerAvailable['Email'] == 'NH' ) ? 'NH' : '';
          gr['Bench Start Date'] = globerAvailable['Bench Start Date'];
          // get the skill from the possibly more up-to-date info
          gr['Role'] = globerAvailable['Skill'];

          var plan=globerAvailable['Plan'];
          if (plan)
            plan=plan.toUpperCase();
          else
            plan="LOW";

          if(  plan!='EXIT' && plan!="TBD"  && plan!="ASSIGNED"  && plan!="CONFIRMED")
            gr['isAvailable'] = true;

        } else {
          gr['New Hire'] = '';
          gr['Bench Start Date'] = new Date( new Date().getTime() + 60 * ( 24 * 60 * 60 * 1000 ) ); // + 60 days
        }
        // gr['Bench Start Date'] = availMap[gr['Email']]['Bench Start Date'];
        // only keep available globers, for now
        if( gr['isAvailable'] ) { globersRowsOK.push( gr ); }
      } catch(error) {
        // log the error
        Logger.log( 'Error normalizing glober ' + gr['Email'] + ': ' + error );
        errorList.addError( error );
      }
    }
    return globersRowsOK;

    function normalizeLocation(itemRow, itemName) {
      var from = itemRow[itemName];
      var to = locationMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        throw( 'Glober location mapping error: ' + from );
      }
    }

    function normalizeSeniority(itemRow, itemName) {
      var from = itemRow[itemName];
      var to = seniorityMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        throw( 'Glober seniority mapping error: ' + from );
      }
    }

    function normalizeEnglishLevel(itemRow, itemName) {
      var from = itemRow[itemName];
      if (!from || isEmptyString(from))
         return 0;
      var to = englishLevelMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        // for now, don't throw( 'Glober english level mapping error: ' + from );
      }
    }

  }

  /********************************************************************************************/
  // normalize the tickets in ticketsRows, returns a new ticketRows array without the
  // tickets with normalization issues
  function normalizeTickets( ticketsRows ) {
    Logger.log( 'about to normalize ' + ticketsRows.length + ' tickets using '
    + seniorityMapper.getName() + ' and ' + locationMapper.getName() + ' mappers');
    var ticketsRowsOK = [];
    for( var i = 0; i < ticketsRows.length; i++) {
      try {
        var tr = ticketsRows[i];
        tr['Work Office'] = normalizeLocation(tr, 'Work Office');
        tr['Staffing Suggestions'] = '';
        ticketsRowsOK.push ( tr );
      } catch(error) {
        // log the error
        Logger.log( error );
        errorList.addError( error );
      }
    }
    return ticketsRowsOK;

    function normalizeLocation(itemRow, itemName) {
      var from = itemRow[itemName];
      var to = locationMapper.map( from );
      if( to != null ) {
        return to;
      } else {
        throw( 'Ticket location mapping error: ' + from );
      }
    }

  }

  /******************************* suggestions calculation ************************************/
  // the suggestions calculation function
  this.computeSuggestions = function(suggestionsSheet, threshold) {
    var calculationsCount = 0;
    var resultHeaders = ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons', 'Client', 'Project'];
    // Glober ID
    // First Name	Last Name (NH) if a new hire
    // (Email) without domain
    // Glober Office quite shortened
    // matching match xx%
    // explain (blah)
    resultValues = [];

    for(var j = 0; j < ticketsRows.length; j++) {
      var ticketRow = ticketsRows[j];

      for( var i = 0; i < globerRows.length; i++ ) {
        var globerRow = globerRows[i];

        calculationsCount++;
        if ( (calculationsCount % 100000) === 0 ) {
          Logger.log( 'Calculating suggestion #' + calculationsCount +' (' + i + ', ' + j + ')' );
        };

        var
          matching = 100,
          matchingLoss = 0,
          matchingReasons = '',
          matchingThreshold = threshold
        ;

        // skill
        var gsk = globerRow['Role'];
        var tsk = ticketRow['Position'];
        if( gsk == tsk ) {
          // good!
        } else {
          // enter a table that maps skill pairs into incompatibility points
          var compatibility = skillsEquivalenceMapper.map( tsk + '_' + gsk );
          if( !! compatibility ) {
            matching = matching - compatibility;
            matchingReasons = matchingExplainAppend( matchingReasons, 'skill', compatibility, gsk, tsk );
          } else {
            matchingReasons = matchingExplainAppend( matchingReasons, 'skill', matching, gsk, tsk );
            matching = 0;
          }
        }
        if( matching < matchingThreshold ) { continue; }

        // dispersion: -20 if glober's location not contained in ticket's location or viceversa
        var gl = globerRow['Glober Office'];
        var tl = ticketRow['Work Office'];
        if( !( tl === '*' || tl.indexOf(gl) >= 0 || gl.indexOf(tl) >= 0 )) {
	  matchingLoss =  20;
          matching = matching - matchingLoss;
          matchingReasons = matchingExplainAppend( matchingReasons, 'location', matchingLoss, gl, tl );
        }
        if( matching < matchingThreshold ) { continue; }

        // seniority:
        assert(globerRow['Seniority Range']," invalid globerRow['Seniority Range'] @ " + 226);
        assert(ticketRow['SeniorityRange']," invalid ticketRow['SeniorityRange'] @ " + 227 + " ticket " + ticketRow['Number']);
        //  invalid ticketRow['SeniorityRange'] @ 227 ticket #144043 (line 6, file "Library_GlobantUtils")

        var gs = parseInt(globerRow['Seniority Range']);
        var ts = parseInt(ticketRow['SeniorityRange']);
        if( ts !== gs )
        {
          if( ts > gs )
          {
            matchingLoss =  10 * ( ts - gs );
          } else {
            matchingLoss =  5 * ( gs - ts );
          }
          matching = matching - matchingLoss;
          matchingReasons = matchingExplainAppend( matchingReasons, 'seniority', matchingLoss, gs, ts );
        }
        if( matching < matchingThreshold ) { continue; }


        // bench date: 1/2 point per workday lost (all dates in whole days)
        matchingLoss = 0;
        var millisPerDay = 24 * 60 * 60 * 1000;
        var todayDate =  ~~((new Date).getTime() / millisPerDay);
        // a) se queda con el máximo entre fecha de comienzo del ticket y hoy
        var startDate = Math.max( ~~( ticketRow['Start Date'].getTime() / millisPerDay ), todayDate );
        // b) se queda con el máximo entre fecha de comienzo del glober y hoy
        var globerDate = Math.max( ~~( globerRow['Bench Start Date'].getTime() / millisPerDay ), todayDate );
        if( startDate > todayDate ) {
          // c) let dif = abs (fecha ticket - fecha glober)
          var diffDays = Math.abs( startDate - globerDate );
          // d) si dif > 7 penalidad = dif / 2
          if( diffDays > 7) {
            matchingLoss = ( diffDays - 7 ) * 0.5;
            matching = matching - matchingLoss;
            matchingReasons = matchingExplainAppend( matchingReasons, 'date', matchingLoss,
            ticketRow['Start Date'].getDate() + '/' + ( ticketRow['Start Date'].getMonth() + 1 ),
            globerRow['Bench Start Date'].getDate() + '/' + ( globerRow['Bench Start Date'].getMonth() + 1 ));
          }
        }
        if( matching < matchingThreshold ) { continue; }

        resultValues.push({
          'Ticket': ticketRow['Number'],
          'Glober ID': globerRow['Glober ID'],
          'Name': globerRow['Last Name'] + ' ' + globerRow['First Name'],
          'New Hire': globerRow['New Hire'],
          'Email': globerRow['Email'].replace( /@globant.com/, '' ),
          'Glober Office': globerRow['Glober Office'],
          'Matching': matching,
          'MatchingReasons': matchingReasons,
	  'Client': ticketRow['Client'],
	  'Project': ticketRow['Project']
        });
      }
    }
    Logger.log( 'End after calculating ' + calculationsCount + ' suggestions, saved ' + resultValues.length );
    // store output
    if (suggestionsSheet) {
      saveSheetObjs( resultHeaders, resultValues, suggestionsSheet, 1000 );
    }
    // email errors log
    errorList.sendEmailWithErrors( emailRecipient, 'Staffing suggestions errors' );


      function matchingExplainAppend( explanation, item, number, gvalue, tvalue ) {
      // Adds another item to the matching reductions explanation, "item" (location,
      // seniority, ...), the reduction "number", and if debug is on the unmatched
      // values from glober and ticket
        explanation += ' ' + item + ':' + number;
        if( debug ) {
          explanation += ' ' + gvalue + ' ' + tvalue;
        }
        return explanation.trim();
      }

  }


  /************************ set suggestions into tickets and availables ***********************/
  this.storeSuggestions = function( suggestionsSheet ) {
    // resultHeaders = ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons', 'Client', 'Project'];

    // Set suggestions in Tickets **************************************************************
    // ticket id
    // Glober ID
    // First Name + Last Name
    // (NH) if a new hire -  The Email column of the Available sheet contains "NH"
    // (Email) without domain
    // Glober Office quite shortened
    // matching match xx%
    // explain (blah)

    // loop over the ticket id column setting up to 8 suggestions per ticket, all in one cell
    // build an array with the new suggestions column
    Logger.log( 'Building a column with the top 8 suggestions texts' );
    var suggestionTexts = {};  // output: the ticket numbers with their suggestions

    var i = 0;
    while ( i < resultValues.length ) {
      var ctrolTicket = resultValues[i]['Ticket']; // current ticket #
      var top8 = []; // array with current ticket's top 8 suggestions
      while( (i < resultValues.length) && (ctrolTicket == resultValues[i]['Ticket']) ) {
        // check if this suggestion makes the ticket's top 8
        checkTop8( top8, resultValues[i] );
        i++;
      }
      // output one ticket's suggestions data
      suggestionTexts[ctrolTicket] = buildSuggestionsText( top8 );
      Logger.log( 'ticket: ' + ctrolTicket + '\n' + buildSuggestionsText( top8 ) );
    }

    Logger.log( 'Setting the top 8 suggestions in the Tickets sheet' );
    if( suggestionTexts.length != ( ticketsSheet.getLastRow() - 1 )) { Logger.log("we are in the oven!"); }

    // apply the suggestions data to the Suggestions column in the tickets sheet
    // the target column header is "Suggestions"
    Logger.log( 'suggestionTexts:' + targetColNum + ' length:' + suggestionTexts.length + ' rows in target:' + ticketsSheet.getLastRow() );

    // get the ticket numbers column and build a coherent column with the suggestions
    var numberColNum = findColumnByHeader( ticketsSheet, "Number" );
    assert(numberColNum,"Cannot find column 'Number'");
    var ticketsCount = ticketsSheet.getLastRow() -1;
    var ticketNumbers = ticketsSheet.getRange( 2, numberColNum, ticketsCount, 1 ).getValues(); // row, col, rows, cols
    var suggestionColumn = [];
    for( var k = 0; k < ticketNumbers.length; k++ ) {
      var tn = ticketNumbers[k][0];
      if( !! suggestionTexts[tn] ) {
        suggestionColumn.push( [ suggestionTexts[tn] ] );
      } else {
        suggestionColumn.push( [ '- - -' ] );
      }
    }

    // paste the suggestions column over the Tickets spreadsheet
    var targetColNum = findColumnByHeader( ticketsSheet, "Suggestions" );
    assert(targetColNum,"Cannot find column 'Suggestions'");
    var targetRange = ticketsSheet.getRange( 2, targetColNum, ticketsCount, 1 ); // row, col, rows, cols
    targetRange.setValues( suggestionColumn );

  /***************************** storeSuggestions sub functions *******************************/

  checkTop8 = function ( top8, resultRow  ) {
    // resultRow: ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons']
    if( top8.length === 0 ) {
      top8[0] = resultRow;
    } else {
      newMatchingValue = resultRow['Matching'];
      for( var i8 = 0; i8 < top8.length; i8++ ) {
        if( newMatchingValue >= top8[i8].Matching ) {        // top8[i8]['Matching'] ) {
          // newMatchingValue is greater then a top8: insert it and drop the last
          top8.splice( i8, 0, resultRow );  // insert suggestion before position i8
          break;
        }
      }
    }
  };

  buildSuggestionsText = function( top8 ) {
    // builds the 8-suggestions text from the top-8 suggestions for this ticket
    // [{'Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons'}*]
    var txt8 = '', t8MatchingReasons;
    for( var i8 = 0; i8 < top8.length; i8++ ) {
      // stop after 8 suggestions, unless it's a debug run
      if( i = 8 && (! debug) ) { break; }
      // t8 is the current suggestion
      var t8 = top8[i8];
      if( t8['MatchingReasons'] == '' )
      {
        t8MatchingReasons = '';
      } else {
        t8MatchingReasons = '(' + t8['MatchingReasons'] + ') ';
      }
      txt8 += '\n' +
      ( t8['New Hire'] == 'NH' ? t8['Name'] + ' (NH) ' : t8['Email'] ) + ' ' + 
      t8['Matching'] + '% ' +
      t8MatchingReasons;
    }
    txt8 = txt8.replace( / NH /g, ' ').replace( /   */g, ' ').replace( /\n  */g, '\n' );
    if( txt8 == '' ) { txt8 = '-' }
    return txt8.replace( '\n', '' ); // drop initial newline
  };

  // Set suggestions in Available ************************************************************
  // #1: Project		['Project']
  // #2: Client		['Client']
  // #3 matching%		['Matching'] + '%'
  // #4: matching reasons     '(' + ['MatchingReasons'] + ')' or null string

  // loop over resultValues building a map, keyed by "GloberId", each item containing 
  // the tickets each glober qualifies for in an array
  Logger.log( 'Building the suggestions per glober map' );
  suggestionsPerGlober = {};
  for( var ii = 0; ii < resultValues.length; ii++ ) 
  {
    var ticketReference =
    {
      Project: resultValues['Project'],
      Client: resultValues['Client'],
      Matching: resultValues['Matching'],
      MatchingReasons: resultValues['MatchingReasons']
    };
    // check if the glober (Available) has an entry else create it
    var globerId = resultValues['Glober Id'];
    var spg = suggestionsPerGlober[ globerId  ];
    if( spg ) 
    {
      spg.push( ticketReference ); 
    } else {
      suggestionsPerGlober[ globerId ] = [ ticketReference ];
    }
  }

  // get the glober id column and build a coherent column with the suggestions
  var availableSheet = getBenchSpreadsheet().getSheetByName('Available');
  var globerIdColNum = availableSheet.findColumnByHeader( ticketsSheet, 'globerId' );
  assert( numberColNum, 'Cannot find column "Number" in "Available" sheet' );
  var availablesCount = availableSheet.getLastRow() -1;
  var globerIds = availableSheet.getRange( 2, globerIdColNum, availablesCount, 1 ).getValues(); // row, col, rows, cols

  // build an array with the new Suggestions column content
  suggestionColumn = [];
  for( ii = 0; ii < globerIds.length; ii++ )  
  {
    spg = suggestionsPerGlober[ globerIds[ii] ];
    if( spg ) 
    {
      suggestionColumn.push( [ buildGloberSuggestionsText(spg) ] );
    } else {
      suggestionColumn.push( [ '- - -' ] );
    }
  }

  // apply the suggestions data to the Suggestions column in the Available sheet
  // the target column header is "Suggestions"
  var targetColNum = findColumnByHeader( availableSheet, "Suggestions" );
  assert( targetColNum, 'Cannot find column "Suggestions" in "Available" sheet' );
  // paste the suggestions column over the Avialable spreadsheet
  var targetRange = availableSheet.getRange( 2, targetColNum, availablesCount, 1 ); // row, col, rows, cols
  targetRange.setValues( suggestionColumn );

  buildGloberSuggestionsText = function( globerSuggestions )
  {
    // sort suggestions by matching, highest first
    globerSuggestions.sort( function(row1, row2) { return( row2['matching'] - row2['matching'] ); })
    // trim to up to 8 suggestions
    if( globerSuggestions.length > 8 ) { globerSuggestions.length = 8; }
    // loop over the up-to-8 suggestions editing the content
    // #1: Project, #2: Client, #3 matching%, #4: matching reasons or null string
    txt8 = '';
    for( i8 = 0; i8 < globerSuggestions.length; i8++ )
    {
      txt8 += '\n' + globerSuggestions['Project'] + ' ' +
      '(' + globerSuggestions['Client'] + ') ' + 
      globerSuggestions['Matching'] + '%' +
      ( globerSuggestions['MatchingReasons'] === '' ) ? '' : ' (' + globerSuggestions['MatchingReasons'] + ')';
      return txt8.replace( '\n', '' ); // drop initial newline
    }
  }
  }

  }
}

