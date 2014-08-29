function computeStaffingSuggestions_cron() 
{
  // var outputSheet = getTestingSpreadsheet().getSheetByName("TicketsWithProblems");
  var suggestionsComputer = new CCPOStaffingSuggestionsClass();
  // suggestionsComputer.computeSuggestions( outputSheet );
}


function CCPOStaffingSuggestionsClass()
{
  var errorList = new CCPOErrorListClass();
  var config = new CCPOConfigClass();
  
  // instantiate various mappers
  var seniorityMapper = config.getMapper("Seniority");
  var locationMapper = config.getMapper("Location");
  var englishLevelMapper = config.getMapper("EnglishLevel");
  
  // var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
  // var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");

  // load the Tickets and normalize them by overwriting the pertinent columns
  var ticketsSheet = getBenchSpreadsheet().getSheetByName("Tickets");
  var ticketsRows = getRows(ticketsSheet);
  Logger.log( "start normalizing tickets" );
  normalizeTickets( ticketsRows );
  Logger.log( "end normalizing tickets" );

  // build a map of the Available sheet (bench) keyed by Email column
  var availMap = computeMap(getBenchSpreadsheet().getSheetByName("Available"), "Email");

  // load the Globers data and normalize it
  var globerSheet =  getBenchSpreadsheet().getSheetByName("Globers");
  var globerRows = getRows(globerSheet);
  Logger.log( "start normalizing globers" );
  normalizeGlobers( globerRows );
  Logger.log( "end normalizing globers" );


  /********************************** main function *******************************************/
  // the suggestions calculation function
  this.computeSuggestions = function(outputSheet) {
    errorList.clear();
    var results = [];
    for(var i = 0; i < globerRows.length; i++) {
      var globerRow = globerRows[i];
      globerRow.isAvailable = ( !! availMap[globerRow.Email] );
      // Logger.log(globerRow.Email + ":" + globerRow.isAvailable) 
      //globerRow.Location = normalizeGloberLocation(globerRow.Location);
      //globerRow.Engle = normalizeGloberLocation(globerRow.Location);
    }

    for(var i = 0; i < ticketsRows.length; i++) {
      var ticketRow = ticketsRows[i];
    }
    
    if (outputSheet) {
      saveSheetObjs(headers,results,outputSheet,1000);
    }
    
    errorList.clear();
  }
  

    /********************************** local subfunctions **************************************/
    // normalize all the globers in globerRows
    function normalizeGlobers( globerRows ) {
      Logger.log( 'about to normalize ' + globerRows.length + ' globers using ' 
      + seniorityMapper.getName() + ' and ' + locationMapper.getName() + ' mappers');
      for( var i = 0; i < globerRows.length; i++) {
        try {
          var gr = globerRows[i];
          //  Glober ID
          //  First Name
          //  Last Name
          //  Email
          //  Birthdate
          //  Entry Date
          //  Role
          //  Seniority
          // ...
          //  LegalID
          //  Glober Office
          //  Society
          //  English level
          // ...
          //  Billable
          //  Max Time Abroad
          //  Starting On
          //  Argentine Passport
          //  Arg Pass Expiration Date
          //  European Passport
          //  European Passport Expiration Date
          //  US Passport
          //  US Passport Expiration Date
          //  US Visa
          //  US VisaType.
          //  US Visa Exp.
          //  Organizational Unit
          //  Upload CV
          //  Last date skills review
          //  Glober Studio
          //  Staff
          // need to add: date since, is available <=> has date
          // ¿what is the date for the non-availables?

          Logger.log( 'glober ' + gr['Glober ID'] + ' normalized, Seniority: ' + gr['Seniority'] + ', Location: ' + gr['Glober Office'] );
        } catch(error) {
          // log the error
          Logger.log( error.message + ' in ' + error.fileName + ' line ' + error.lineNumber );
          // put glober into errors array
          // delete glober from normal data
        }
      }
      // locals here $$$$ these functions too similar, let's generalize (later)
    
      function normalizeLocation(itemRow, itemName) {
        var from = itemRow[itemName];
        var to = locationMapper.map( itemRow[itemName] );
        if( ! to ) {
          // mapping failed: return original value and store error
          return from; 
          errorList.addError( 'Location mapping error: ' + from );
        } else {
          return to; 
        }
        Logger.log( locationMapper.map( itemRow[itemName] ));
      }
      
      function normalizePosition(itemRow, itemName) {
      }
      
      function normalizeSeniority(itemRow, itemName) {
        var from = itemRow[itemName];
        // delete numeric prefix and dash, and then map
        // from.replaceText('^[0-9 -]*', '');
        var to = seniorityMapper.map( itemRow[itemName] );
        if( !! to ) {
          return to; 
        } else {
          // mapping failed: return original value and store error
          return from; 
          errorList.addError( 'Seniority mapping error: ' + from );
        }
      }
      
    }

    // normalize all the tickets in ticketsRows
    function normalizeTickets( ticketsRows ) {
      Logger.log( 'about to normalize ' + ticketsRows.length + ' tickets using ' 
      + seniorityMapper.getName() + ' and ' + locationMapper.getName() + ' mappers');
      for( var i = 0; i < ticketsRows.length; i++) {
        try {
          var tr = ticketsRows[i];
          // los nombres de todas las columnas, para controlar que no estoy omitiendo una (luego se eliminan)
          // Number
          // Name
          // Client
          // Project
          // Position
          // tr['Position'] = normalizePosition(tr, 'Position');                                ¿esto de mapea? ¿es el skill?
          // Seniority
          tr['Seniority'] = normalizeSeniority(tr, 'Seniority'); // this crappy args are a hack to call "by reference"
          // Load
          // Start Date
          // Work Office
          tr['Work Office'] = normalizeLocation(tr, 'Work Office');
          // Estimated Travel Period
          // Replacement
          // Client Interview Required?
          // Stage
          // Aging
          // Priority
          // Open Position
          // Cluster
          // BU
          // ProjectTag
          // ProjectState
          // Staffing Suggestions
          tr['Staffing Suggestions'] = '';
          // TL
          // TD
          // Bucket (Weeks)
          // Days to comply SLA
          // Seniority Range
          tr['Seniority Range'] = normalizeSeniority(tr, 'Seniority Range');
          // bucket Informed
          // Handler
          // Handler Team
          // Submit Date
          // Update Date
          // Studio
          // Glow Submitter
          // Type of Position
          Logger.log( 'ticket ' + tr['Number'] + ' normalized, Seniority: ' + tr['Seniority'] + ', Location: ' + tr['Work Office'] );
        } catch(error) {
          // log the error
          Logger.log( error.message + ' in ' + error.fileName + ' line ' + error.lineNumber );
          // put ticket into errors array
          // delete ticket from normal data
        }
      }
    
      function normalizeLocation(itemRow, itemName) {
        var from = itemRow[itemName];
        var to = locationMapper.map( itemRow[itemName] );
        if( ! to ) {
          // mapping failed: return original value and store error
          return from; 
          errorList.addError( 'Location mapping error: ' + from );
        } else {
          return to; 
        }
        Logger.log( locationMapper.map( itemRow[itemName] ));
      }
      
      function normalizePosition(itemRow, itemName) {
      }
      
      function normalizeSeniority(itemRow, itemName) {
        var from = itemRow[itemName];
        // delete numeric prefix and dash, and then map
        // from.replaceText('^[0-9 -]*', '');
        var to = seniorityMapper.map( itemRow[itemName] );
        if( !! to ) {
          return to; 
        } else {
          // mapping failed: return original value and store error
          return from; 
          errorList.addError( 'Seniority mapping error: ' + from );
        }
      }
    }
  }


/*
Upon mapping errors, add the rogue value to the mapping table as a new item, and
display a UI allowing the user to edit the new mapped value if an "interactive"
switch is on. 
In the UI show the complete mapping table but allow edition of the new value only.
Then reload the mapper's list. 
Acomplish this with a few methods of the Mapper class: add new item, render all
items (in HTML), reload mapping table, edit value. 
*/














