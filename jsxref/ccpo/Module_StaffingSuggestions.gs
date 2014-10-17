function computeStaffingSuggestions_cron()
{
  Logger.log( 'Staffing suggestions calculation process' );

  var suggestionsOptions = // only values differing from defaults
  {
    // TEST: errorsEmailRecipients: Session.getActiveUser().getEmail(),
    errorsEmailRecipients: 'nicolas.gerpe@globant.com,juan.lanus@globant.com',
    readOnly: true, 
    debug: true
  };
  
  var suggestionsCalculator = new CCPOStaffingSuggestionsClass( suggestionsOptions );
  suggestionsCalculator.computeSuggestions( );
  suggestionsCalculator.storeSuggestions( );
  Logger.log( 'Staffing suggestions calculation process ended' );
}


function CCPOStaffingSuggestionsClass( options )
{
  // configure settings by merging options with defaults
  var defaults =
  {
    // where the calculator will store the suggestions - name of a writable sheet
    suggestionsSheetName: 'StaffingSuggestions',
    // discard suggestions with matching percent below this value (0~100)
    minMatchingThreshold: 75,
    // send the errors log to the following email(s) - separate with comma
    errorsEmailRecipients: 'dario.robak@globant.com, nicolas.gerpe@globant.com',
    // minimum knowledge level considered in skills data
    minKnowledge: 4,
    // don't write to the database (for testing)
    readOnly: false, 
    // debug run: the log will contain additional info
    debug: true
  };
  var settings = new Settings( defaults, options );

  /**************************************** setup *********************************************/
  var errorList = new CCPOErrorListClass();

  // instantiate various mappers used for data normalization
  var config = new CCPOConfigClass();
  var seniorityMapper = config.getMapper("Seniority");
  var locationMapper = config.getMapper("Location");
  var englishLevelMapper = config.getMapper("EnglishLevel");
  var skillsEquivalenceMapper = config.getMapper("SkillsEquivalence");

  // the tickets file
  var ticketsSheet = getBenchSpreadsheet().getSheetByName("Tickets");
  assert( ticketsSheet, 'The "Tickets" sheet not available' );
  var ticketsRows = getRows(ticketsSheet);

  // the globers file
  var globerSheet = getBenchSpreadsheet().getSheetByName("Globers");
  assert( globerSheet, 'The "Globers" sheet not available' );
  var globerRows = getRows(globerSheet);

  // the availables file
  var availableSheet = getBenchSpreadsheet().getSheetByName('Available');
  assert( availableSheet, 'The "Available" sheet is not available' );
  var availableRows = getRows( availableSheet );
  assert( findColumnByHeader( availableSheet, "Email" ), 'The "Email" column not found in "Available"' );
  var availMap = computeMap( getBenchSpreadsheet().getSheetByName("Available"), "Email" );

  // the skills data object
  var skills = new CCPOGloberSkillsClassZ( settings.debug );

  // the computed results (staffing suggestions)
  var resultValues;
  var suggestionsSheet = getTestingSpreadsheet().getSheetByName( settings.suggestionsSheetName );
  assert( suggestionsSheet, 'The "StaffingSuggestions" sheet is not available' );
  var resultHeaders = ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons', 'Client', 'Project'];

  // the matchings to ignore file
  var matchingsToIgnoreSheet = getBenchSpreadsheet().getSheetByName("MatchingsToIgnore");
  assert( globerSheet, 'The "MatchingsToIgnore" sheet not available' );
  // build a map keyed by Ticket and Glober Name
  var matchingsToIgnoreRows = getRows( matchingsToIgnoreSheet );
  var matchingsToIgnore = [];
  for( var mti = 0; mti < matchingsToIgnoreRows.length; mti++ ) 
  {
    mtiRow = matchingsToIgnoreRows[mti];
    matchingsToIgnore.push( '#' + mtiRow['Ticket'] + '_' + mtiRow['Glober Name'] );
    // DEBUG: Logger.log( 'Matching to ignore: #' + mtiRow['Ticket'] + '_' + mtiRow['Glober Name'] );
  }
  // DEBUG: Logger.log( 'Matchings to ignore: ' + matchingsToIgnore.length );
  matchingsToIgnoreRows.length = 0;
  
  // the already-suggested log
  var assignmentLogSheet = getLogSpreadsheet().getSheetByName("Assignment Log");
  assert( assignmentLogSheet, 'The "Assignment Log" sheet not available' );
  var assignmentLogRows = getRows( assignmentLogSheet );
  // build a map indexed on "Ticket" and "Glober Name"
  for( var ial = 0; ial < assignmentLogRows.length; ial++ ) 
  {
    alRow = assignmentLogRows[ial];
    matchingsToIgnore.push( alRow['Ticket'] + '_' + alRow['Glober Name'] );
  }
  Logger.log( 'Matchings to ignore: ' + matchingsToIgnore.length );
  assignmentLogRows.length = 0;

  /****************************** normalization functions *************************************/
  this.normalizeLocation = function( from )
  {
    // clear all but the first 2 parts of the location
    var parts = from.toUpperCase().split( '/' );
    if( parts.length > 2 ) { from = parts[0] + '/' + parts[1]; }
    // all USA locations are the same
    if( parts.length > 0 && parts[0] === 'EU' ) { from = 'EU'; }
    var to = locationMapper.map( from );
    if( to != null ) {
      return to;
    } else {
      throw( 'Location mapping error: ' + from );
    }
  }

  this.normalizeSeniority = function( from )
  {
    if( from == 'N/A' ) { Logger.log( 'mapped N/A to 2 - ZZZ' ); return '2 - ZZZ'; }
    var to = seniorityMapper.map( from );
    if( to != null ) {
      return to;
    } else {
      throw( 'Seniority mapping error: ' + from );
    }
  }

  this.normalizeEnglishLevel = function( from )
  {
    if ( ! from ) { return 0; }
    var to = englishLevelMapper.map( from );
    if( to != null ) {
      return to;
    } else {
      // for now, do not throw( 'English level mapping error: ' + from );
      return 0;
    }
  }

  /********************************************************************************************/
  // normalize the tickets in ticketsRows, returns a new ticketRows array without the tickets
  // with issues
  this.normalizeTickets = function ()
  {
    Logger.log( 'about to normalize ' + ticketsRows.length + ' tickets' );
    var ticketsRowsOK = [];
    for( var i = 0; i < ticketsRows.length; i++ ) {
      try {
        var tr = ticketsRows[i];
        tr['SeniorityRange'] = this.normalizeSeniority( tr['SeniorityRange'] );
        tr['Work Office'] = this.normalizeLocation( tr['Work Office'] );
        tr['Suggestions'] = '';
        tr['Skills'] = skills.getSkillsByPosition( tr['Position'] );
        // DEBUG: Logger.log( 'ticket:' + tr['Number'] + ' skills:' + tr['Skills'] );
        ticketsRowsOK.push( tr );
      } catch( error ) {
        var errorTxt = 'Error normalizing ticket ' + tr['Number'] + ': ' + error;
        Logger.log( errorTxt );
        errorList.addError( errorTxt );
      }
    }
    return ticketsRowsOK;
  }

  /********************************************************************************************/
  // normalize all the globers in globerRows, return an array with only the good ones
  this.normalizeGlobers = function ( globerRows )
  {
    Logger.log( 'about to normalize ' + globerRows.length + ' globers' );
    var globersRowsOK = [];
    var millisPerDay = 24 * 60 * 60 * 1000;
    for( var i = 0; i < globerRows.length; i++ )
    {
      try {
        var gr = globerRows[i];
        gr['Seniority Range'] = this.normalizeSeniority( gr['Seniority'] );
        gr['Glober Office'] = this.normalizeLocation( gr['Glober Office'] );
        gr['English level'] = this.normalizeEnglishLevel(gr, 'English level');
        // find out if the glober is available
        gr['isAvailable'] = false;
        var globerAvailable = availMap[gr['Email']];
        if( !! globerAvailable ) {
          gr['New Hire'] = ( globerAvailable['Email'] == 'NH' ) ? 'NH' : '';
          gr['Bench Start Date'] = globerAvailable['Bench Start Date'];
          gr['Role'] = globerAvailable['Skill']; // possibly more up-to-date info
          gr['Skills'] = skills.globerSkillsFilterByLevel(
            skills.getGloberSkillsZ( ~~( gr['Glober ID'] ) ), 
            settings.minKnowledge
          );
          var plan = globerAvailable['Plan'].toUpperCase();
          if( ! plan ) { plan = 'LOW'; }
          if( plan != 'EXIT' && plan != 'TBD' && plan != 'ASSIGNED' && plan != 'CONFIRMED' )
          {
            gr['isAvailable'] = true;
          }
        } else {  // the glober is not in the Available roster
          gr['New Hire'] = '';
          gr['Bench Start Date'] = new Date( Date.now() + 60 * millisPerDay ); // + 60 days
        }
        // gr['Bench Start Date'] = availMap[gr['Email']]['Bench Start Date'];
        // keep only available globers, for now
        if( gr['isAvailable'] ) { globersRowsOK.push( gr ); }
      } catch( error ) {
        var errorTxt = 'Error normalizing glober ' + gr['Email'] + ': ' + error;
        Logger.log( errorTxt );
        errorList.addError( errorTxt );
      }
    }
    return globersRowsOK;
  }

  /********************************************************************************************/
  // make normalized globers out of the newhires in the Available sheet and append them to
  // the globerRows array
  this.normalizeNewHires = function( )
  {
    Logger.log( 'About to make normalized globers out of the newhires from Available' );

    // if the glober has no id then assign a negative one, for the process
    var temporaryGloberId = -1;
    for( var i = 0; i < availableRows.length; i++ )
    {
      var ar = availableRows[i];
      if( ar['Email'] === 'NH' )
      { // is a newhire: build the normalized fake glober row
        try 
        {
          var gr = {
            'Glober ID': ar['globerId'] || temporaryGloberId--,
            'First Name': ar['Name'],
            'Last Name': '',
            'Entry Date': ar['Bench Start Date'],
            'Role': ar['Skill'],
            'Skills': skills.getGloberSkillsZ( ar['globerId'] ), // surely empty
            'Seniority': ar['SeniorityRange'],
            'Seniority Range': this.normalizeSeniority( ar['SeniorityRange'] ),
            'Seniority': ar['SeniorityRange'],
            'Glober Office': this.normalizeLocation( ar['Location'] ),
            'English level': this.normalizeEnglishLevel( ar['English'] ),
            'Max Time Abroad': ar['canTravel'],
            'isAvailable': true,
            'Bench Start Date': ar['Bench Start Date'],
            'New Hire': 'NH',
            // unused columns:
            'Billable': '', 'Society': '', 'LegalID': '', 'Last Name': '', 'Email': 'NH', 'Birthdate': '',
            'Starting On': '', 'Argentine Passport': '', 'Arg Pass Expiration Date': '', 'European Passport': '',
            'European Passport Expiration Date': '', 'US Passport': '', 'US Passport Expiration Date': '',
            'US Visa': '', 'US VisaType.': '', 'US Visa Exp.': '', 'Organizational Unit': '', 'Upload CV': '',
            'Last date skills review': '', 'Glober Studio': '', 'Staff': ''
          };
          // append to the globers roster
          globerRows.push( gr );
        } catch( error ) {
          var errorTxt = 'Error normalizing newhire ' + ar['Name'] + ': ' + error;
          Logger.log( errorTxt );
          errorList.addError( errorTxt );
        }
      }
    }
    Logger.log( 'Negative glober ids assigned down to ' + temporaryGloberId );
  }

  /******************************* suggestions calculation ************************************/
  // the suggestions calculation function: for each ticket loop over the normalized globers
  // calculating their fit for the ticket, push the results into the suggestionsSheet
  // columns: Ticket, Glober ID, Name, New Hire, Email, Glober Office, Matching, MatchingReasons, Client, Project
  this.computeSuggestions = function()
  {
    // normalize tickets and globers, rows with normalizing issues are dropped
    ticketsRows = this.normalizeTickets( ticketsRows );
    globerRows = this.normalizeGlobers( globerRows );
    // incorporate the newhires as normalized globers
    this.normalizeNewHires( );

    var calculationsCount = 0;
    resultValues = [];

    for(var j = 0; j < ticketsRows.length; j++) {
      var ticketRow = ticketsRows[j];

      for( var i = 0; i < globerRows.length; i++ ) {
        var globerRow = globerRows[i];
        // DEBUG
        if( globerRow['Glober ID'] === undefined ) { Logger.log( 'row ' + i + ' has "Glober ID" === undefined' ); }

        calculationsCount++;
        if ( (calculationsCount % 10000) === 0 ) {
          Logger.log( 'Calculating suggestion #' + calculationsCount +' (' + i + ', ' + j + ')' );
        };

        var
          matching = 100,
          matchingLoss = 0,
          matchingReasons = '',
          info = {}
        ;

        // skill
        var gsk = globerRow['Role'];
        var tsk = ticketRow['Position'];
        if( gsk === tsk )
        {
          // good! don't even look at the skills data
        } else {
          // enter a table that maps skills pairs into incompatibility points
          var compatibility = skillsEquivalenceMapper.map( tsk + '_' + gsk );
          if( !! compatibility ) 
          {
            // glober role ~= ticket position has priority
            matching = matching - compatibility;
            matchingReasons = matchingExplainAppend( matchingReasons, 'skill', compatibility, gsk, tsk );
          }
          else
          {
            if( skills.hasCompatibleSkills( tsk, globerRow['Skills'], info ))
            {
              // has a skills set compatible with the position requested
              matching = matching - info.matchingLoss;
              if( matching < 0 ) { matching = 0; }
              // Logger.log( 'info.matchingLoss:' + info.matchingLoss + ' info.matchingReasons: ' + info.matchingReasons );
              matchingReasons = info.matchingReasons;
            }
            else
            {
              // not a match
              matchingReasons = matchingExplainAppend( matchingReasons, 'skill', matching, gsk, tsk );
              matching = 0;
            }
          }
        }
        if( matching < settings.minMatchingThreshold ) { continue; }

        // dispersion: -20 if glober's location not contained in ticket's location or vice versa
        var gl = globerRow['Glober Office'];
        var tl = ticketRow['Work Office'];
        if( !( tl === '*' || tl.indexOf(gl) >= 0 || gl.indexOf(tl) >= 0 )) {
          matchingLoss = 20;
          matching = matching - matchingLoss;
          matchingReasons = matchingExplainAppend( matchingReasons, 'location', matchingLoss, gl, tl );
        }
        if( matching < settings.minMatchingThreshold ) { continue; }

        // seniority:
        var gs = parseInt(globerRow['Seniority Range']);
        if( isNaN( gs )) { Logger.log( 'Seniority in glober data maps to NaN  (' + i + ', ' + j + ')' ); }
        var ts = parseInt(ticketRow['SeniorityRange']);
        if( isNaN( ts )) { Logger.log( 'Seniority in ticket data maps to NaN  (' + i + ', ' + j + ')' ); }
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
        if( matching < settings.minMatchingThreshold ) { continue; }

        // bench date: 1/2 point per workday lost (all dates in whole days)
        matchingLoss = 0;
        var millisPerDay = 24 * 60 * 60 * 1000;
        var todayDate =  ~~( Date.now() / millisPerDay );
        // a) se queda con el máximo entre fecha de comienzo del ticket y hoy
        var startDate = Math.max( ~~( ticketRow['Start Date'].getTime() / millisPerDay ), todayDate );
        // b) se queda con el máximo entre fecha de comienzo del glober y hoy
        var globerDate = Math.max( ~~( globerRow['Bench Start Date'].getTime() / millisPerDay ), todayDate );
        if( startDate > todayDate )
        {
          // c) let dif = abs (fecha ticket - fecha glober)
          var diffDays = Math.abs( startDate - globerDate );
          // d) si dif > 7 penalidad = dif / 2
          if( diffDays > 7)
          {
            matchingLoss = ( diffDays - 7 ) * 0.5;
            matching = matching - matchingLoss;
            matchingReasons = matchingExplainAppend( matchingReasons, 'date', matchingLoss,
            ticketRow['Start Date'].getDate() + '/' + ( ticketRow['Start Date'].getMonth() + 1 ),
            globerRow['Bench Start Date'].getDate() + '/' + ( globerRow['Bench Start Date'].getMonth() + 1 ));
          }
        }
        if( matching < settings.minMatchingThreshold ) { continue; }
        
        // check if this suggestion is listed to be excluded
        if( matchingsToIgnore.indexOf( ticketRow['Number'] + '_' + ( globerRow['First Name'] + ' ' + globerRow['Last Name'] ).trim() ) >= 0 )
        { 
          if( settings.debug ) {
            var nIgnore = matchingsToIgnore.indexOf( ticketRow['Number'] + '_' + ( globerRow['First Name'] + ' ' + globerRow['Last Name'] ).trim() );
            Logger.log( 'Suggestion ignored: ' + nIgnore + ' ' + ticketRow['Number'] + '_' + globerRow['First Name'] + ' ' + globerRow['Last Name'] );
          }
          continue; 
        }

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
      } // next glober
    } // next ticket
    Logger.log( 'End after calculating ' + calculationsCount + ' suggestions, saved ' + resultValues.length );
    // store output
    if( ! settings.readOnly ) { saveSheetObjs( resultHeaders, resultValues, suggestionsSheet, 1000 ); }
    // email errors log
    errorList.sendEmailWithErrors( settings.errorsEmailRecipients, 'Staffing suggestions errors' );


        function matchingExplainAppend( explanation, item, number, gvalue, tvalue ) {
        // Adds another item to the matching loss explanation, "item" (location,
        // seniority, ...), the loss "number", and if debug is on the compared
        // values from glober and ticket
          if( ! explanation ) { explanation = ''; }
          explanation += ' ' + item + ':' + number;
          if( settings.debug ) {
            explanation += ' ' + gvalue + ' ' + tvalue;
          }
          return explanation.replace( /  */g, ' '); // $$$$ WAS: .trim();
        }
  }

  /************************ set suggestions into tickets and availables ***********************/
  this.storeSuggestions = function()
  {
  // suggestions columns: Ticket, Glober ID, Name, New Hire, Email, Glober Office, Matching, MatchingReasons, Client, Project

    // Set suggestions into Tickets ************************************************************
    Logger.log( 'About to store the staffing suggestions into Tickets sheet' );

    // loop over the ticket id column setting up to 8 suggestions per ticket, all in one cell
    // build an map with the new suggestions data
    var suggestionTexts = {};  // output: the ticket numbers with their suggestions

    // loop over the results grouping by ticket
    var i = 0;
    while ( i < resultValues.length ) {
      var ctrolTicket = resultValues[i]['Ticket']; // current ticket #
      var top8 = []; // array to store current ticket top 8 suggestions
      // build the ticket top 8 suggestions array
      while( (i < resultValues.length) && (ctrolTicket == resultValues[i]['Ticket']) ) {
        top8.push( resultValues[i] );
        i++;
      }
      top8.sort( function(row1, row2) { return( row2['Matching'] - row1['Matching'] ); });
      if( top8.length > 8 ) { top8.length = 8; }        
      // output one ticket suggestions data
      suggestionTexts[ctrolTicket] = this.buildSuggestionsText( top8 );
    }

    // get the ticket number column from Tickets and build a congruent column with the suggestions
    var numberColNum = findColumnByHeader( ticketsSheet, "Number" );
    assert(numberColNum,'Cannot find column "Number" in "Tickets" sheet');
    var ticketsCount = ticketsSheet.getLastRow() -1;
    var ticketNumbers = ticketsSheet.getRange( 2, numberColNum, ticketsCount, 1 ).getValues(); // row, col, rows, cols
    var suggestionsColumn = [];
    for( var k = 0; k < ticketNumbers.length; k++ ) {
      var tn = ticketNumbers[k][0];
      if( !! suggestionTexts[tn] ) {
        suggestionsColumn.push( [ suggestionTexts[tn] ] );
      } else {
        suggestionsColumn.push( [ '- - -' ] );
      }
    }

    // paste the suggestions column over the Tickets spreadsheet
    var targetColNum = findColumnByHeader( ticketsSheet, "Suggestions" );
    assert( targetColNum, 'Cannot find column "Suggestions" in "Tickets" sheet' );
    var targetRange = ticketsSheet.getRange( 2, targetColNum, ticketsCount, 1 ); // row, col, rows, cols
    if( ! settings.readOnly ) { targetRange.setValues( suggestionsColumn ); }


    // Set suggestions in Available ************************************************************
    // #1: Ticket        ['Ticket']
    // #2: Project        ['Project']
    // #3: Client         ['Client']
    // #4 matching%       ['Matching'] + '%'
    // #5: matching reasons '(' + ['MatchingReasons'] + ')' or null string
    Logger.log( 'About to store the staffing suggestions into Available sheet' );

    // loop over resultValues building a map, keyed by "GloberId", each item containing 
    // a glober`s tickets in an array
    suggestionsPerGlober = {};
    for( var ii = 0; ii < resultValues.length; ii++ ) 
    {
      var rv = resultValues[ii];
      var ticketReference = // only the needed columns 
      { 
        Ticket: rv['Ticket'],
        Project: rv['Project'],
        Client: rv['Client'],
        Matching: rv['Matching'],
        MatchingReasons: rv['MatchingReasons']
      };
      // check if the glober (Available) has an entry in the map else create it
      var globerId = rv['Glober ID'];
      if( ! globerId ) { Logger.log( 'A suggestion with no glober id, row ' + ii ); }
      var spg = suggestionsPerGlober[ globerId ];
      if( spg ) 
      {
        spg.push( ticketReference );
      } else {
        suggestionsPerGlober[ globerId ] = [ ticketReference ];
      }
    }

    // get the glober id column from Available and build a congruent column with the suggestions
    var globerIdColNum = findColumnByHeader( availableSheet, 'globerId' );
    assert( numberColNum, 'Cannot find column "globerId" in "Available" sheet' );
    var availablesCount = availableSheet.getLastRow() - 1;
    var globerIds = availableSheet.getRange( 2, globerIdColNum, availablesCount, 1 ).getValues(); // row, col, rows, cols

    // build an array with the new Suggestions column content
    suggestionsColumn = [];
    for( var iii = 0; iii < globerIds.length; iii++ )  
    {
      var spg8 = suggestionsPerGlober[ globerIds[iii] ];
      if( spg8 ) 
      {
        suggestionsColumn.push( [ this.buildGloberSuggestionsText( spg8 ) ] );
      } else {
        suggestionsColumn.push( [ '- - -' ] );
      }
    }

    // apply the suggestions data to the Suggestions column in the Available sheet
    // the target column header is "Suggestions"
    var targetColNum = findColumnByHeader( availableSheet, "Suggestions" );
    assert( targetColNum, 'Cannot find column "Suggestions" in "Available" sheet' );
    // paste the suggestions column over the Available spreadsheet
    var targetRange = availableSheet.getRange( 2, targetColNum, availablesCount, 1 ); // row, col, rows, cols
    if( ! settings.readOnly ) { targetRange.setValues( suggestionsColumn ); }

  }

  /***************************** storeSuggestions sub functions *******************************/
  // Ticket, Glober ID, Name, New Hire, Email, Glober Office, Matching, MatchingReasons, Client, Project

      this.buildGloberSuggestionsText = function( globerSuggestions )
      {
        // sort  a glober's suggestions by matching, highest first
        globerSuggestions.sort( function( row1, row2 ) {
          if( isNaN( row1['Matching'] )) { 
            Logger.log( 'Sort fails at Ticket: ' + row1['Ticket'] + ' Glober ID: ' + row1['Glober ID'] ); 
            row1['Matching'] = 999;
          }
          if( isNaN( row2['Matching'] )) { 
            Logger.log( 'Sort fails at Ticket: ' + row2['Ticket'] + ' Glober ID: ' + row2['Glober ID'] ); 
            row2['Matching'] = 999;
          }
          return( row2['Matching'] - row1['Matching'] ); 
        });
        // trim to up to 8 suggestions (keep all in debugging runs)
        if( ( globerSuggestions.length > 8) && (! settings.debug) ) { globerSuggestions.length = 8; }
        // loop over the up-to-8 suggestions editing the content
        // #1: Project, #2: Client, #3 matching%, #4: matching reasons or null string
        txt8 = '';
        for( i8 = 0; i8 < globerSuggestions.length; i8++ )
        {
          var gs = globerSuggestions[i8];
          var gsmr = gs['MatchingReasons'];
          if( gsmr !== '' ) { gsmr = '(' + gsmr.trim() + ')'; }
          txt8 += '\n' + gs['Ticket'] + ' ' + gs['Project'] + ' (' + gs['Client'] + ') ' + gs['Matching'] + '% ' + gsmr;
        }
        return txt8.replace( '\n', '' ); // drop initial newline
      }


      this.buildSuggestionsText = function( top8 ) {
        // builds the 8-suggestions text from the top-8 suggestions for this ticket
        // [{'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons'}*]
        var txt8 = '', t8MatchingReasons;
        for( var i8 = 0; i8 < top8.length; i8++ ) {
          // stop after 8 suggestions, unless it's a debug run
          if( i8 === 8 && (! settings.debug) ) { break; }
          // t8 is the current suggestion
          var t8 = top8[i8];
          if( t8['MatchingReasons'] === '' )
          {
            t8MatchingReasons = '';
          } else {
            t8MatchingReasons = '(' + t8['MatchingReasons'].trim() + ') ';
          }
          txt8 += '\n' + 
          ( t8['New Hire'] == 'NH' ? t8['Name'] + ' (NH) ' : t8['Email'] ) + ' ' + 
          t8['Matching'] + '% ' + t8MatchingReasons;
        }
        txt8 = txt8.replace( / NH /g, ' ').replace( /   */g, ' ').replace( /\n  */g, '\n' );
        if( txt8 === '' ) { txt8 = '-' }
        return txt8.replace( '\n', '' ); // drop initial newline
      };

  return this;
}

