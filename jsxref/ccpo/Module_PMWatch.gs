function PMWatch() {
// Makes reports involving PMs and their related globers

  pmWatch = new PMWatchClass();
  // var gxpm = pmWatch.reportGlobersXPM();

}

function PMWatchClass( options ) {

  settings = {
    readOnly: false
  };

  function isManager( GloberPosition )
  {
    // list of "Glober Position" values considered managerial
    managers = [
      'BISManager',
      'BIS Manager',
      'BU Director',
      'Business Development Director',
      'Chief Financial Officer',
      'Chief Information Officer',
      'Chief Operations Officer',
      'Chief People Officer',
      'Chief Solutions Officer',
      'Client Partner',
      'Communication Manager',
      'Consultancy Manager',
      'Contact Center Manager',
      'Country Manager',
      'Creative Director',
      'Customer Loyalty Manager',
      'Delivery Director',
      'Delivery Manager',
      'Delivery Partner',
      'Director',
      'Director Human Capital Systems',
      'Director Software Development',
      'Engagement Manager',
      'Executive Director',
      'Finance & Treasury Manager',
      'Finance Processes Manager',
      'Founder',
      'M&A Manager',
      'Manager Software Development',
      'Net Engineer Manager',
      'Office Manager',
      'People Care Manager',
      'People Careers Manager',
      'People Champions Manager',
      'Procurement Manager',
      'Program Manager',
      'Project Manager',
      'Project Manager Hc Systems',
      'Project Manager Technology ',
      'QCI Manager',
      'Recruiting Manager',
      'Senior Manager Global Compensation',
      'Senior Manager Human Capital Systems',
      'Senior Manager Project Instructional Des',
      'Staff Manager',
      'Sysadmin Engineer Manager',
      'Tech Director',
      'Tech Partner',
      'Transactional Services Manager'
    ];
    return ( managers.indexOf( GloberPosition ) >= 0 );
  }

  function isANumber( n ) {
    var numStr = /^-?(\d+\.?\d*)$|(\d*\.?\d+)$/;
    return numStr.test( n.toString() );
  }

  function logObject( objx ) {
    Logger.log( JSON.stringify( objx, undefined, 4 ) );
  }

  var i, j, k;

  /******************************************************************************/
  Logger.log( 'PMs coverage report\n' );
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
  var nProjects = 0;
  var nProjectsWithPM = 0;
  var nPMsXProject = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
  // define the PMs collection, prime with the fake no-PM collector
  var pms = {};
  var pmEmail;
  var fakePMEmail = 'NOPM@globant.com';
  pms[fakePMEmail] = { pmEmail: fakePMEmail, projects: {} };
  var projectsSheetRows = getRows( projectsSheet );
  for( i = 0; i < projectsSheetRows.length; i++ )
  {
    var psrow = projectsSheetRows[i];
    var projTag = psrow['Project Tag'];
    if( psrow['Project State'] === 'ON_GOING' )
    {
      nProjects++;
        
      // build an array with the PM emails
      var pmEmails = psrow['Current Project Managers Emails'];
      if( pmEmails ) 
      { // there is at least one PM email
        // count as a project that has at least one PM
        nProjectsWithPM++;
        // store the emails as an array
        pmEmails = pmEmails.split(' - '); // .uniq(); // some PMs appear 2+ times
        // count into PMs per project stats
        nPMsXProject[pmEmails.length]++;

        // add to the PMs map
        for( j = 0; j < pmEmails.length; j++ )
        // for( pmEmail in pmEmails )
        {
          pmEmail = pmEmails[j];
          var pmsItem = pms['pmEmail'];
          if( ! pmsItem ) 
          { 
            pmsItem = { 'pmEmail': pmEmail, 'projects': {} }; 
            pms[pmEmail] = pmsItem;
          }
          // add the project to the pms item
          pmsItem['projects'][projTag] = {};
        }
      }
      else
      { // there are no PMs in this project
        // count into PMs per project stats
        nPMsXProject[0]++;
        // add a collector PM
        pmEmails = [ fakePMEmail ];        
      }
      // add to projects data map
      projectsData[projTag] = { 
        'Project Tag': projTag,
        'Project State': psrow['Project State'], 
        'Billing Flag': psrow['Billing Flag'],
        'PMEmails': pmEmails,
        'sumOfPMAss': 0,  // Σ of all PM percents
        'Assignments': []
      };
    }
  }
  projectsSheetRows = undefined;
  Logger.log( 'Loaded Projects data, ' + nProjects + ' ON_GOING projects of which '+  nProjectsWithPM + ' have PMs' );
  Logger.log( 'PMs per project counters (first is zero PMs): ' + nPMsXProject.toString() );


  /******************************************************************************/
  // CurrentAssignments: 
  // Store assignment data into the 'Assignments' map of each project
  // Glober ID, Glober Position, E-Mail, Client TAG, Client Name, Project TAG, Project Name,
  // Project Studio, Starting Date, End Date, Percentage, Availability, Business Unit, Business Unit Tag
  var currentAssignmentsClass = new CCPOAssignmentClass();
  var currentAssignmentsRows = currentAssignmentsClass.getAllAssignmentsForDate( new Date() );
  var totalAssignments = 0;

  for( i = 0; i < currentAssignmentsRows.length; i++ )
  {
    var assRow = currentAssignmentsRows[i];
    var assEmail = assRow['E-Mail'];
    var assProject = assRow['Project TAG'];
    // assginment data to store by project 
    var assData = {
      'email': assEmail,
      'percent': assRow['Percentage'],
      'position': assRow['Glober Position'],
      'isManager': isManager( assRow['Glober Position'] )
    };

    // add the assignment data to the project`s data
    var theProjectRow = projectsData[assProject];
    if( ! theProjectRow )
    { // not an ON_GOING project TAG: log anomaly
      if( assData['percent'] > 0 )
      {
        Logger.log( 'Glober ' + assEmail + ' assigned @ ' + assData['percent'] +
        '% to not ON_GOING project ' + assProject );
      }
    }
    else
    {
      // add this assigned glober to this project
      theProjectRow['Assignments'].push( assData );
      totalAssignments += assData['percent'] / 100;

      // check if this is a PM
      pmData = pms[assEmail];
      if( pmData ) // this one is a PM
      // store the PMs assignment percent
      {
        // add this project and the percent to PM`s projects
        pmData['projects'][assProject] = {
          'project': assProject,
          'percent': assRow['Percentage'],
          'client': theProjectRow['Client TAG']
        };

        // add to the Σ of PM assignment percents for this project
        theProjectRow['sumOfPMAss'] += ( assRow['Percentage'] );

        // DEBUG:
        if( assEmail === 'luis.marino@globant.com' ) { logObject( pmData ); }
      }
    }
  }
  currentAssignmentsRows = undefined;
  Logger.log( 'Loaded CurrentAssignments data, ' + i + ' items, total assigned headcount: ' + totalAssignments );


  /******************************************************************************/
  // calculate the globers per project, with and without managers, and store the
  // info in projectsData.headCounts
  Logger.log( 'Calculate the globers per project' );
  for( var pp in projectsData )
  {
    pp = projectsData[pp];

    // calculate and store the project proportional headcount
    var ass = pp['Assignments'];
    var headCount = 0;
    var headCountNoManagers = 0;
    for( i = 0; i < ass.length; i++ ) 
    {
      if( ass[i]['percent'] )
      {
        headCount += ass[i]['percent'];
        if( ! (ass[i]['isManager'] === true) ) { headCountNoManagers += ass[i]['percent']; }
      }
    }
    pp['headCounts'] = {
      'headCount': headCount / 100,
      'headCountNoManagers': headCountNoManagers / 100
    };
    // Logger.log( 'project: ' + pp['Project Tag'] + ' headcounts: ' + pp['headCounts'][headCount] +
    // ' ' + pp['headCounts'][headCountNoManagers] );
  }

  /******************************************************************************/
  // integrate per PM

  var rolesToReport = [ 
    'Program Manager', 
    'Project Manager', 
    'Project Manager Hc Systems', 
    'Project Manager Technology', 
    'Staff Manager'
  ];

  // load globers data to join
  // Glober ID, First Name, Last Name, Email, Birthdate, Entry Date, Role, Seniority, LegalID,
  // Glober Office, Society, English level, Billable, Max Time Abroad, Starting On, Argentine Passport,
  // Arg Pass Expiration Date, European Passport, European Passport Expiration Date, US Passport,
  // US Passport Expiration Date, US Visa, US VisaType., US Visa Exp., Organizational Unit, Upload CV,
  // Last date skills review, Glober Studio, Staff

  var globersSheet = getBenchSpreadsheet().getSheetByName("Globers");
  assert( globersSheet, 'The "Globers" sheet is not available' );
  assert( findColumnByHeader( globersSheet, "Email" ), 'The "Email" column not found in "Globers"' );
  var globersMap = computeMap( getBenchSpreadsheet().getSheetByName("Globers"), "Email" );

  // the report: an array to be stored in a sheet
  var headCountPerPMHeaders = [ 'Email', 'Total', 'No managers', 'Glober Office', 'Glober Studio', 'Role' ];
  var headCountPerPM = [];

  for( var aPM in pms ) // loop over all PMs
  {
    aPM = pms[aPM];
    var aPMEmail = aPM['pmEmail'];

    // skip fake placeholder PM
    // if( aPMEmail === fakePMEmail ) { continue; }

    // get the PM`s data from Globers sheet
    if( aPMEmail === fakePMEmail )
    {
      PMData = '';
      var aPMGloberData = {
        'Role': 'Project Manager',
        'Glober Office': 'unknown',
        'Glober Studio': 'unknown'
      };
    }
    else
    {
      var aPMGloberData = globersMap[aPMEmail];
      var PMData = ', "' + aPMGloberData['Glober Office'] + '", "' + aPMGloberData['Glober Studio'] + '", "' + aPMGloberData['Role'] + '"';
      if( assEmail === 'luis.marino@globant.com' ) { logObject( pmData ); }
    }

    // only include the selected roles
    if( rolesToReport.indexOf( aPMGloberData['Role'] ) < 0 ) { continue; }

    // process the PM`s projects data
    var aPMProjects = aPM['projects'];
    var aPMHeadCount = 0;
    var aPMHeadCountNoManagers = 0;
    for( var aPMProject in aPMProjects ) // loop over this PM`s projects
    {
      aPMProject = aPMProjects[aPMProject];
      // aPMProject has {project: "ABC001", percent:100}
      if( aPMProject.hasOwnProperty('project') ) {
        var projectData = projectsData[aPMProject['project']];
        // projectData contains headCounts = { headCount: x, headCountNoManagers: y, pms: [] };
        var headCounts = projectData['headCounts'];
        if( ! projectData['sumOfPMAss'] ) 
        {
          Logger.log( 'no sum of PM assignments for ' + aPMEmail + ' in project ' + aPMProject['project'] );
        }
        aPMHeadCount += headCounts['headCount'] * aPMProject['percent'] / projectData['sumOfPMAss'];
        aPMHeadCountNoManagers += headCounts['headCountNoManagers'] * aPMProject['percent'] / projectData['sumOfPMAss'];
      }
    }
    // output a PM`s numbers
    Logger.log( aPMEmail + ', ' + ( aPMHeadCount ) + ', ' + ( aPMHeadCountNoManagers ) + PMData );
    headCountPerPM.push( {
      'Email': aPMEmail,
      'Total': aPMHeadCount, 
      'No managers': aPMHeadCountNoManagers, 
      'Glober Office': aPMGloberData['Glober Office'], 
      'Glober Studio': aPMGloberData['Glober Studio'], 
      'Role': aPMGloberData['Role']
    } );

  }
  // store the report data in a sheet PMReportSheet
  // for now until an official definition use this: 
  // https://docs.google.com/a/globant.com/spreadsheets/d/19IKjuU0Sl0xKUqW_4uYCKXRKMijFjishQPCUyVFO04A/edit#gid=1527109446
  var outSpreadsheet = SpreadsheetApp.openById( '19IKjuU0Sl0xKUqW_4uYCKXRKMijFjishQPCUyVFO04A' );
  var PMReportSheet = outSpreadsheet.getSheetByName( 'headCountXPM' );
  if( ! settings.readOnly ) { saveSheetObjs( headCountPerPMHeaders, headCountPerPM, PMReportSheet, 1000 ); }


  /******************************************************************************/
  // enumerate the projects without PM
  /* Logger.log( '\nPM-less projects:' );
  for( var pp in projectsData )
  {
    pp = projectsData[pp];
    var ass = pp['Assignments'];
    if( ! ( ass === [] ) ) // has assignments
    {
      // Logger.log( 'project ' + pp['Project Tag'] + ' has assigments ' + pp['pmEmails'].toString() );
      pmEmails = pp['PMEmails'];  // PMEmails:["NOPM@globant.com"]
      if( pmEmails[0] === fakePMEmail )
      {
        headCounts = pp['headCounts'];  // headCounts:{headCount:0, headCountNoManagers:0}},
        Logger.log( 'project ' + pp['Project Tag'] + ': total globers: ' + headCounts['headCount'] + ' non-managers: ' + headCounts['headCountNoManagers'] ); 
      }
    }
  } */

}


















