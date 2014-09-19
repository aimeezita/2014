function computeStaffingSuggestions_cron()
{
  Logger.log( 'Staffing suggestions calculation process' );
  var suggestionsOptions = // with values differing from defaults
  {
    errorsEmailRecipients: 'juan.lanus@globant.com',
    debug: true
  };
  var suggestionsCalculator = new CCPOStaffingSuggestionsClass( suggestionsOptions );
  suggestionsCalculator.computeSuggestions( );
  suggestionsCalculator.storeSuggestions( );
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
    // send the errors log to the followong email(s) - separate with comma
    errorsEmailRecipients: 'dario.robak@globant.com, nicolas.gerpe@globant.com',
    // debug run: the log will contain additional info
    debug: false
  };
  var settings = new Settings( defaults, options );

  /**************************************** setup *********************************************/
  var errorList = new CCPOErrorListClass();
  var config = new CCPOConfigClass();

  // instantiate various mappers used for data normalization
  var seniorityMapper = config.getMapper("Seniority");
  var locationMapper = config.getMapper("Location");
  var englishLevelMapper = config.getMapper("EnglishLevel");
  var skillsEquivalenceMapper = config.getMapper("SkillsEquivalence");

  // the tickets file
  var ticketsSheet = getBenchSpreadsheet().getSheetByName("Tickets");
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

  // the computed results (staffing suggestions)
  var resultValues;
  var suggestionsSheet = getTestingSpreadsheet().getSheetByName( settings.suggestionsSheetName );
  assert( suggestionsSheet, 'The "StaffingSuggestions" sheet is not available' );
  var resultHeaders = ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons', 'Client', 'Project'];


  /****************************** normalization functions *************************************/
  this.normalizeLocation = function( from )
  {
    var to = locationMapper.map( from );
    if( to != null ) {
      return to;
    } else {
      throw( 'Location mapping error: ' + from );
    }
  }

  this.normalizeSeniority = function( from )
  {
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
  this.normalizeTickets = function ( )
  {
    Logger.log( 'about to normalize ' + ticketsRows.length + ' tickets using' );
    var ticketsRowsOK = [];
    for( var i = 0; i < ticketsRows.length; i++ ) {
      try {
        var tr = ticketsRows[i];
        tr['Work Office'] = this.normalizeLocation( tr['Work Office'] );
        tr['Suggestions'] = '';
        ticketsRowsOK.push ( tr );
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
    for( var i = 0; i < globerRows.length; i++ ) {
      try {
        var gr = globerRows[i];
        gr['Seniority Range'] = this.normalizeSeniority( gr['Seniority'] );
        gr['Glober Office'] = this.normalizeLocation( gr['Glober Office'] );
        gr['English level'] = this.normalizeEnglishLevel(gr, 'English level');
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
    Logger.log( 'about to make normalized globers out of the newhires from Available' );

    // loop over the Available rows making glober rows out of the hewhires
    for( var i = 0; i < availableRows.length; i++ )
    {
      var ar = availableRows[i];
      if( ar['Email'] == 'NH' )
      {
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
            'Seniority Range': this.normalizeSeniority( ar['SeniorityRange'] ),
            'Seniority': ar['SeniorityRange'],
            'LegalID': '',
            'Glober Office': this.normalizeLocation( ar['Location'] ),
            'Society': '',
            'English level': this.normalizeEnglishLevel( ar['English'] ),
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
        } catch( error ) {
          var errorTxt = 'Error normalizing newhire ' + tr['Name'] + ': ' + error;
          Logger.log( errorTxt );
          errorList.addError( errorTxt );
        }
      }
    }
  }

  /******************************* suggestions calculation ************************************/
  // the suggestions calculation function: for each ticket loop over the normalized globers
  // calculating their fit for the ticket, store the results in suggestionsSheet
  // columns: Ticket, Glober ID, Name, New Hire, Email, Glober Office, Matching, MatchingReasons, Client, Project
  this.computeSuggestions = function()
  {

    // normalize tickets and globers, rows with normalizing issues are deleted
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

        calculationsCount++;
        if ( (calculationsCount % 100000) === 0 ) {
          Logger.log( 'Calculating suggestion #' + calculationsCount +' (' + i + ', ' + j + ')' );
        };

        var
          matching = 100,
          matchingLoss = 0,
          matchingReasons = '',
          matchingThreshold = settings.minMatchingThreshold
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
          matchingLoss = 20;
          matching = matching - matchingLoss;
          matchingReasons = matchingExplainAppend( matchingReasons, 'location', matchingLoss, gl, tl );
        }
        if( matching < matchingThreshold ) { continue; }

        // seniority:
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
    saveSheetObjs( resultHeaders, resultValues, suggestionsSheet, 1000 );
    // email errors log
    errorList.sendEmailWithErrors( settings.errorsEmailRecipients, 'Staffing suggestions errors' );


      function matchingExplainAppend( explanation, item, number, gvalue, tvalue ) {
      // Adds another item to the matching reductions explanation, "item" (location,
      // seniority, ...), the reduction "number", and if debug is on the unmatched
      // values from glober and ticket
        if( ! explanation ) { explanation = ''; }
        explanation += ' ' + item + ':' + number;
        if( settings.debug ) {
          explanation += ' ' + gvalue + ' ' + tvalue;
        }
        return explanation.replace( /  */g, ' '); // $$$$ .trim();
      }
  }

  /************************ set suggestions into tickets and availables ***********************/
  this.storeSuggestions = function()
  {
  // column: Ticket, Glober ID, Name, New Hire, Email, Glober Office, Matching, MatchingReasons, Client, Project

    // Set suggestions into Tickets ************************************************************
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
      var top8 = []; // array with current ticket top 8 suggestions
      while( (i < resultValues.length) && (ctrolTicket == resultValues[i]['Ticket']) ) {
        // check if this suggestion makes the ticket top 8
        this.checkTop8( top8, resultValues[i] );
        i++;
      }
      // output one ticket suggestions data
      suggestionTexts[ctrolTicket] = this.buildSuggestionsText( top8 );
      Logger.log( 'ticket: ' + ctrolTicket + '\n' + this.buildSuggestionsText( top8 ) );
    }

    Logger.log( 'Setting the top 8 suggestions in the Tickets sheet' );
    if( suggestionTexts.length != ( ticketsSheet.getLastRow() - 1 )) { Logger.log("we are in the oven!"); }

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

  // Set suggestions in Available ************************************************************
  // #1: Project                ['Project']
  // #2: Client         ['Client']
  // #3 matching%               ['Matching'] + '%'
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
  var globerIdColNum = findColumnByHeader( availableSheet, 'globerId' );
  assert( numberColNum, 'Cannot find column "Number" in "Available" sheet' );
  var availablesCount = availableSheet.getLastRow() - 1;
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

  /***************************** storeSuggestions sub functions *******************************/

  this.checkTop8 = function ( top8, resultRow  ) {
  // resultRow: ['Ticket', 'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons']
    if( top8.length === 0 ) {
      top8[0] = resultRow;
    } else {
      newMatchingValue = resultRow['Matching'];
      for( var i8 = 0; i8 < top8.length; i8++ ) {
        if( newMatchingValue >= top8[i8].Matching ) {        // top8[i8]['Matching'] ) 
          // newMatchingValue is greater then a top8: insert it and drop the last
          top8.splice( i8, 0, resultRow );  // insert suggestion before position i8
          break;
        }
      }
    }
  };

  this.buildSuggestionsText = function( top8 ) {
    // builds the 8-suggestions text from the top-8 suggestions for this ticket
    // [{'Glober ID', 'Name', 'New Hire', 'Email', 'Glober Office', 'Matching', 'MatchingReasons'}*]
    var txt8 = '', t8MatchingReasons;
    for( var i8 = 0; i8 < top8.length; i8++ ) {
      // stop after 8 suggestions, unless it's a debug run
      if( i = 8 && (! settings.debug) ) { break; }
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

  return this;

}

