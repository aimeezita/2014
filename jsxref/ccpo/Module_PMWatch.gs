function PMWatch() {
// Makes reports involving PMs and their related globers

  pmWatch = new PMWatchClass();
  var gxpm = pmWatch.reportGlobersXPM();

}

function PMWatchClass( options ) {

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
  var projectsIndex = []; // item n has the nth project´s tag
  var nProjects = 0;
  var nProjectsWithPM = 0;
  var nPMsXProject = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
  // define the PMs collection, prime with the fake no.PMs collector
  var pms = {};
  var pmsEmailsZ = {};
  var pmEmail;
  var fakePMEmail = 'NOPM@globant.com';
  pms[fakePMEmail] = { pmEmail: fakePMEmail, projects: {} };
  var projectsSheetRows = getRows( projectsSheet );
  for( i = 0; i < projectsSheetRows.length; i++ )
  {
    var psrow = projectsSheetRows[i];
    var projTag = psrow['Project Tag'];
    projectsIndex.push( projTag );
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
        nPMsXProject[ pmEmails.length ]++;

        // add to the PMs map
	for( j = 0; j < pmEmails.length; j++ )
        // for( pmEmail in pmEmails )
        {
	  pmEmail = pmEmails[j];
          pmsEmailsZ[pmEmail] = pmEmail;                                     // a list of all PMs
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
        'PMEmails': pmEmails,
        'Assignments': []
      };
    }
  }
  // projectsSheetRows = undefined;    not so fast ...
  Logger.log( 'Loaded Projects data, ' + nProjects + ' ON_GOING projects of which '+  nProjectsWithPM + ' have PMs' );
  Logger.log( 'PMs per project counters (first is zero PMs): ' + nPMsXProject.toString() );


  /******************************************************************************/
  // CurrentAssignments: 
  // Store assignment data into the 'Assignments' map of each project
  // Glober ID, Glober Position, E-Mail, Client TAG, Client Name, Project TAG, Project Name,
  // Project Studio, Starting Date, End Date, Percentage, Availability, Business Unit, Business Unit Tag
  var currentAssignmentsClass = new CCPOAssignmentClass();
  var currentAssignmentsRows = currentAssignmentsClass.getAllAssignmentsForDate( new Date() );

  // currentAssignmentsData, store only a few cols keyed by email: E-Mail, Project TAG, Percentage
  var currentAssignmentsData = {};                                       //     <== NOT NEEDED?

  var pmProject = {};
  for( i = 0; i < currentAssignmentsRows.length; i++ )
  {
    var isPM = false;
    var assRow = currentAssignmentsRows[i];
    var assEmail = assRow['E-Mail'];
    var assProject = assRow['Project TAG'];
    var assData = {};
    assData['email'] = assEmail;
    assData['percent'] = assRow['Percentage'];
    assData['position'] = assRow['Glober Position'];
    assData['isManager'] = isManager( assData['position'] );

    isPM = !! pmsEmailsZ[assEmail];
    if( isPM ) { pmProject[assEmail + '_' + assProject] = assRow['Percentage']; }

    // add the assignment data to the project`s data
    var theProjectRow = projectsData[assProject];
    if( ! theProjectRow )
    { // rogue Project TAG: add it to the map
      theProjectRow = { 
        'Project Tag': assProject,
        'Project State': 'NOT ONGOING',
        'PmEmails': [],
        'Assignments': []
      };
      projectsData[assProject] = theProjectRow;
    }
    theProjectRow['Assignments'].push( assData );


    currentAssignmentsData[assEmail + '_' + assProject] = {
      'E-Mail': assEmail,
      'Project TAG': assProject,
      'Percentage': assRow['Percentage']
    };
    // store the PMs assignment percent per project in the pms dictionary
    pmData = pms[assEmail];
    if( pmData ) // this one is a PM
    {
      // add this project and the assigned percent
      pmData['projects'][assProject] = 
      {
        'project': assProject,
        'percent': assRow['Percentage']
      };
    }
  }
  currentAssignmentsRows = undefined;
  Logger.log( 'Loaded CurrentAssignments data, ' + i + ' items' );


  /******************************************************************************/
  // calculate the globers per project, with and without managers
  Logger.log( 'Calculate the globers per project' );
  // var pdk = projectsData.keys;
  // for( k = 0; k < pdk.length; k++ )
  var pp;
  for( pp in projectsData )
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
    Logger.log( 'project: ' + pp['Project Tag'] + ' headcounts: ' + pp['headCounts'][headCount] +
    ' ' + pp['headCounts'][headCountNoManagers] );
  }

  /******************************************************************************/
  // integrate per PM
  for( var aPM in pms ) // loop over all PMs
  {
    aPM = pms[aPM];
    var aPMEmail = aPM['pmEmail'];
    var aPMProjects = aPM['projects'];
    var aPMHeadCount = 0;
    var aPMHeadCountNoManagers = 0;
    for( var aPMProject in aPMProjects ) // loop over this PM`s projects
    {
      aPMProject = aPMProjects[aPMProject];
      // aPMProject has {project: "ABC001", percent:100}
      projectData = projectsData[aPMProject['project']];
      // projectData contains headCounts = { headCount: x, headCountNoManagers: y, pms: [] };
      var headCounts = projectData['headCounts'];
      aPMHeadCount += headCounts['headCount'] * aPMProject['percent'];
      aPMHeadCountNoManagers += headCounts['headCountNoManagers'] * aPMProject['percent'];
    }
    // output a PM`s numbers
    Logger.log( aPMEmail + ', ' + aPMHeadCount + ', ' + aPMHeadCountNoManagers );
  }

  /******************************************************************************/
  // enumerate the projects without PM
  /*
  Logger.log( '\nPM-less projects:' );
  for( var pp in projectsData )
  {
    pp = projectsData[pp];
    var ass = pp['Assignments'];
    if( ! isEmptyObject( ass ) )  IS AN ARRAY ...
    {
      // Logger.log( 'project ' + pp['Project Tag'] + ' has assigments ' + pp['pmEmails'].toString() );
      pmEmails = pp['PMEmails'];
      pData = pp['projectData'];
      if( pmEmails[0] === fakePMEmail )
      {
        Logger.log( 'project ' + pp['Project Tag'] + ': total globers: ' + pData['headCount'] + ' non-managers: ' + pData['headCountNoManagers'] ); 
      }

    }
  } */

}





