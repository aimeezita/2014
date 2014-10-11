function PMWatch2() {
// Makes reports involving PMs and their related globers

  pmWatch = new PMWatchClass2();

}

function PMWatchClass2( options ) {

  settings = {
    readOnly: false
  };


  var currentAssignmentsClass = new CCPOAssignmentClass();
  var currentAssignmentsRows = currentAssignmentsClass.getAllAssignmentsForDate( new Date() );
  assert(currentAssignmentsRows.length > 0);
  
  function getPercentAssigned( email, projectTag )
  // given an email and a proj tag return the % assigned, or zero
  {
    for( var i = 0; i < currentAssignmentsRows.length; i++ )
    {
      var assRow = currentAssignmentsRows[i];
      if( email == assRow['E-Mail'] && projectTag == assRow['E-Mail'] )
      {
         return assRow['Percentage'];
      }
    }
    return 0;    
  }
  
  function getGlobersAssigned( projectTag )
  {
    var globers=new Array();
    for( var i = 0; i < currentAssignmentsRows.length; i++ )
    {
      var assProject = assRow['Project TAG'];
      if ( projectTag == assProject )
      {
         globers.push(assRow);
      }
    }
    return globers;    
  }


/******************************************************************************/
  Logger.log( 'PMs coverage report\n' );
  // Projects sheet cols: Project Tag, Project State, Current Project Managers Emails,      
  // Client TAG, Client, Project Tag, Project, Contract Type, Process Type, Studio,
  // Project State, Currency, Current Delivery Directors, Current Delivery Directors Emails,
  // Current Project Managers, Current Project Managers Emails, Current Technical Leaders,
  // Current Technical Leaders Email, Current Technical Director, Current Technical Director Email,
  // Business Unit, Billing Flag, Business Unit Tag,   

  // the projects file
  var projectsSheet = getBenchSpreadsheet().getSheetByName('Projects');
  assert( projectsSheet, 'The "Projects" sheet is not available' );
  var projectsSheetRows = getRows( projectsSheet );
  assert(projectsSheetRows.length > 0);

  // the globers file
  var globersSheet = getBenchSpreadsheet().getSheetByName("Globers");
  assert( globersSheet, 'The "Globers" sheet not available' );
  assert( findColumnByHeader( globersSheet, "Email" ), 'The "Email" column not found in "Globers"' );
  var globersMap = computeMap( getBenchSpreadsheet().getSheetByName("Globers"), "Email" );
  
  var pmEmail;
  var fakePMEmail = 'NOPM@globant.com';
  
  // add an array with the verified PMs to non-internal ON_GOING projects
  var projectMapByTag = {};
  for( var i = 0; i < projectsSheetRows.length; i++ )
  {
    var psrow = projectsSheetRows[i];
    var projTag = psrow['Project Tag'];
  
    if( psrow['Project State'] != 'ON_GOING' ) { continue; }
    if( psrow['Client TAG'] == "GLO001" ) { continue; }

    // build an array with the PM emails of the project
    var pmEmails = psrow['Current Project Managers Emails'];
    psrow.thePMs = [];
    
    if( ! isEmptyString( pmEmails ) ) 
    { 
      pmEmails = pmEmails.split(' - ');
      for( var j = 0; j < pmEmails.length; j++ )
      {
        pmEmail = pmEmails[j];
        var thePMGloberData = globersMap[pmEmail];
        if( ! thePMGloberData ) { continue; } // not a glober any more
        if( pmEmails.indexOf( pmEmail ) < j ) { continue; } // skip duplicates
        var percent = getPercentAssigned( pmEmail, projTag );
        if( percent < 2 ) { continue; }
        // add this PM to this project
        psrow.thePMs.push( {
          email:pmEmail,
          percent:percent,
          reporting:0,
          location:thePMGloberData['Glober Office'],
          role:thePMGloberData['Role']
        } );
      }
      // DEBUG:
      // if( i > 111 ) { break; }
    }
    
    // normalize PM percent
    var sumPercent = 0;
    for ( var j = 0; j < psrow.thePMs.length; j++ )
    {
      sumPercent += psrow.thePMs[j].percent;
    }
    if ( sumPercent < 1 )
    { // a PM-less project
      psrow.thePMs = { email:fakePMEmail, percent:100, reporting:0, location:'*', role:'Project Manager' };
    }
    else
    {
      for ( var j = 0; j < psrow.thePMs.length; j++ )
      {
        psrow.thePMs[j].percent = psrow.thePMs[j].percent * 100 / sumPercent;
      }
    }
    projectMapByTag[projTag] = psrow;
  }
  
  // loop over the assignments accumulating by PM into the projects array
  for( i = 0; i < currentAssignmentsRows.length; i++ )
  {
    var assRow = currentAssignmentsRows[i];
    var assProjectTag = assRow['Project TAG'];
    var psrow = projectMapByTag[assProjectTag];
    if ( ! psrow ) { continue; }
    for ( var j = 0; j < psrow.thePMs.length; j++ )
    {
      psrow.thePMs[j].reporting += psrow.thePMs[j].percent * assRow['Percentage'];      
    }
  }
  
/******************************************************************************/
  // report: PM	projectTag client project percentage reporting location role
  var theReportHeaders = [ 'PM', 'projectTag', 'client', 'project', 'percentage', 'reporting', 'location', 'role' ];
  var theReport = {};
  for( i = 0; i < projectsSheetRows.length; i++ )
  {
    var psrow = projectsSheetRows[i];
    var projTag = psrow['Project Tag'];
  
    for( var aPM in psrow.thePMs ) 
    {
      var aReportItem = {
        PM: aPM.email,
        projectTag: projTag,
        client: psrow['Client TAG'],
        project: psrow['Project'],
        percentage: aPM.percent,
        reporting: aPM.reporting,
        location: aPM.location,
        role: aPM.role
      };
      theReport[aPM.email + '_' + projTag] = aReportItem;
    }

    // sort?

    // store the report data in a sheet PMReportSheet
    // for now until an official definition use this: (I cannot write the official database)
    // https://docs.google.com/a/globant.com/spreadsheets/d/19IKjuU0Sl0xKUqW_4uYCKXRKMijFjishQPCUyVFO04A/edit#gid=1527109446
    var outSpreadsheet = SpreadsheetApp.openById( '19IKjuU0Sl0xKUqW_4uYCKXRKMijFjishQPCUyVFO04A' );
    var PMReportSheet = outSpreadsheet.getSheetByName( 'headCountXPM' );
    if( ! settings.readOnly ) { saveSheetObjs( theReportHeaders, theReport, PMReportSheet, 1000 ); }
  }
}

