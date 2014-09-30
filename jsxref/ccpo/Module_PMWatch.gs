function PMWatch() {
// Makes reports involving PMs and their related globers

  pmWatch = new PMWatchClass();
  var gxpm = pmWatch.reportGlobersXPM();

}

function PMWatchClass( options ) {



  // Projects sheet: Project Tag, Project State, Current Project Managers Emails,      
  // Client TAG, Client, Project Tag, Project, Contract Type, Process Type, Studio,
  // Project State, Currency, Current Delivery Directors, Current Delivery Directors Emails,
  // Current Project Managers, Current Project Managers Emails, Current Technical Leaders,
  // Current Technical Leaders Email, Current Technical Director, Current Technical Director Email,
  // Business Unit, Billing Flag, Business Unit Tag,   
  var projectsSheet = getBenchSpreadsheet().getSheetByName('Projects');
  assert( projectsSheet, 'The "Projects" sheet is not available' );
  // projectsData: Project Tag, Project State, Current Project Managers Emails


  // get all projects data, store only the needed cols in projectsData keyed by TAG
  // build a PMs dictionary to hold their assignment percent to the projects
  var projectsData = {}; 
  var pms = {};
  var projectsSheetRows = projectsSheet.getRows();
  for( var i = 0; i < projectsSheetRows.length; i++ )
  {
    var psrow = projectsSheetRows[i];
    var pmEmails = psrow['Current Project Managers Emails'].split(' - ');
    for( pmEmail in pmEmails )
    {
      pms['pmEmail'] = { 'pmEmail': pmEmail, 'projects': {} };
    }
    if( pmEmails.length === 0 ) { pmEmails.push( 'NOPM@globant.com' ); }
    if( true )                           // WAS: psrow['Project State'] === 'ON_GOING' )
    {
      projectsData[psrow['Project Tag']] = { 
        'Project Tag': psrow['Project Tag'], 
        'Project State': psrow['Project State'], 
        'PmEmails': pmEmails,
        'Assignments': []
      };
    }
  }
  projectsSheetRows = undefined;
  Logger.log( 'Loaded Projects data, ' + projectsData.length + ' items' );


  // CurrentAssignments sheet: 
  // Glober ID, Glober Position, E-Mail, Client TAG, Client Name, Project TAG, Project Name,
  // Project Studio, Starting Date, End Date, Percentage, Availability, Business Unit, Business Unit Tag
  var currentAssignmentsSheet = getBenchSpreadsheet().getSheetByName('CurrentAssignments');
  assert( currentAssignmentsSheet, 'The "CurrentAssignments" sheet is not available' );
  // currentAssignmentsData: E-Mail, Project TAG, Percentage
  var currentAssignmentsData = {};

  // get CurrentAssignments data, store only a few columns keyed by email
  var currentAssignmentsSheetRows = currentAssignmentsSheet.getRows();
  for( i = 0; i < currentAssignmentsSheetRows.length; i++ )
  {
    var carow = currentAssignmentsSheetRows[i];
    currentAssignmentsData[carow['E-Mail']] = { 
      'E-Mail': carow['E-Mail'],
      'Project TAG': carow['Project TAG'],
      'Percentage': carow['Percentage']
    };
    // store the PMs assignment percent per project in the pms dictionary
    pmData = pms[carow['E-Mail']];
    if( pmData ) // this is a PM
    {
      pmData['projects'][carow['Project TAG']] =
      {
        'project': carow['Project TAG'],
        'percent': carow['Percentage']
      };
    }
  }
  currentAssignmentsSheetRows = undefined;
  Logger.log( 'Loaded CurrentAssignments data, ' + currentAssignmentsData.length + ' items' );


  // join by project: collect all the assigned into arrays mapped by Project TAG, in the 
  // 'Assignments' property of projectsData
  // add any weird project tag to the list, if any
  for( i = 0; i < currentAssignmentsData.length; i++ )
  {
    var assRow =  currentAssignmentsData[i];
    var theProjectTAG = assRow['Project TAG'];
    var theProjectRow = projectsPerTAGMap[ theProjectTAG ];
    if( ! theProjectRow )
    { // weird Project TAG: add it to the map
      theProjectRow = { 
        'Project Tag': theProjectTAG,
        'Project State': 'UNKNOWN',
        'PmEmails': [],
        'Assignments': []
      };
      projectsData[theProjectTAG] = theProjectRow;
    }
    theProjectRow['Assignments'].push( assRow );
  }

  // calculate the globers per project and then distribute by PM
  // only include projects ON_GOING and UNKNOWN
  for( p in projectsData )
  {
    if( p['Project State'] === 'ON_GOING' || p['Project State'] === 'UNKNOWN' )
    {
      // calculate the project headcount
      // $$$$ INCLUDES THE PMs FOR NOW
      projectData = { headCount = 0, pms = [] };
      var ass = p['Assignments'];
      var headCount = 0;
      for( i = 0; i < ass.length; i++ ) 
      {
        headCount += ass['Percentage'];
      }
      projectData.headCount = headCount / 100;

      // get the PMs information
      for( var j = 0; j < p['PmEmails'].length; j++ )
      {
        // get the PM record
        var pmEmail = p[j];
        var pmRecord = pms[pmEmail];
        // pmRecord has a map by tag og the PM`s projects
        var pmProject = pmRecord['projects'][p['Project Tag']];
        // pms['pmEmail'] = { 'pmEmail': pmEmail, 'projects': {} };
        // $$$$ pmData = pms[carow['E-Mail']];
      }

    }
  }


}


  // the availables file
  var availableSheet = getBenchSpreadsheet().getSheetByName('Available');
  assert( availableSheet, 'The "Available" sheet is not available' );
  var availableRows = getRows( availableSheet );
  assert( findColumnByHeader( availableSheet, "Email" ), 'The "Email" column not found in "Available"' );
  var availMap = computeMap( getBenchSpreadsheet().getSheetByName("Available"), "Email" );

