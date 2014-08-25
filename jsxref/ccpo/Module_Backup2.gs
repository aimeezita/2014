function backupBenchFile2_cron() {

  // constants (some are to be stored in a property bag sheet)
  var
    MAX_BACKUP_AGE_DAYS = 20,
    BACKUP_FOLDER_ID = '0BzgUaAY0-dteclRubW5xcXlqV1k',
    EMAIL_RECIPIENTS = 'juan.lanus@globant.com' // DEBUG: 'dario.robak@globant.com, analia.altieri@globant.com, nicolas.gerpe@globant.com'
  ;

  // backup requests: description and drive id of the sources, comes from CCPO configuration sheet
  var backupRequests = [
    { description: 'human readable name', id: 'Google drive file id' },
  ];


  /******************************************************************************/
  // BACKUP MAIN PROCESS:
  Logger.log( 'Starting backup process ' + backupFileDate() + '\r\n') ;

  // get the list of files to backup from CCPO configuration sheet
  var configSheet =  getBenchSpreadsheet().getSheetByName("FilesToBackup");
  backupRequests = getRows( configSheet );

  // prune destination folder, ignore any failure (not essential to the purpose)
  pruneBackupFiles( MAX_BACKUP_AGE_DAYS );

  // loop over the backup requests doing each file
  for( var i = 0; i < backupRequests.length; i++ ) {
    try {
      // try to backup the current file, request #i
      backupFile( backupRequests[i].description, backupRequests[i].id );
    } catch( error ) {
      // the backup failed: report it (file, error, log so far)
      var msgText = '\r\nError trying to backup ' + backupRequests[i].description
      + '\r\n' + error.message
      + '\r\n' + 'file id: "' + backupRequests[i].id + '"'
      + '\r\n' + '\r\n'
      + '\r\n' + 'Process log:'
      + '\r\n' + Logger.getLog();
      MailApp.sendEmail( EMAIL_RECIPIENTS, 'Bench files backup failed', msgText );
      throw 'Backp of ' + backupRequests[i].description + ' failed: ' + error.message;
    }
  }
  Logger.log( 'End of bench files backup' );
  MailApp.sendEmail( EMAIL_RECIPIENTS, 'Bench files backup ended OK', Logger.getLog() );


  /******************************************************************************/
  // LOCAL FUNCTIONS:

  // format a date yyyymmdd_hhmmss to be prepended to backup file names
  function backupFileDate() {
    var currentDate = new Date();
    return currentDate.getFullYear()
    + String( '0' + (currentDate.getMonth() + 1) ).slice(-2)
    + String( '0' + currentDate.getDate() ).slice(-2)
    + '_'
    + String( '0' + currentDate.getHours() ).slice(-2)
    + String( '0' + currentDate.getMinutes() ).slice(-2)
    + String( '0' + currentDate.getSeconds() ).slice(-2);
  }

  // backup one file, given a human-readable description and its id
  function backupFile( sourceFileDescription, sourceFileId ) {
    var file = DriveApp.getFileById( sourceFileId );
    var folder = DriveApp.getFolderById( BACKUP_FOLDER_ID );
    var backupFileName = backupFileDate() + file.getName(); 
    Logger.log( 'About to backup ' + sourceFileDescription + ' into ' + backupFileName );
    var backup = file.makeCopy( backupFileName, BACKUP_FOLDER_ID );
    Logger.log( 'Backup of ' + sourceFileDescription + ' stored OK' );
  }

  function pruneBackupFiles( maxAgeInDays ) {
    // cut date: older backup files will be pruned
    var cutDate = new Date();
    cutDate.setDate( cutDate.getDate() - maxAgeInDays )

    Logger.log( 'Deleting backup files previous to ' + cutDate );

    // process backup folder files, ckecking for dated previous to the cut date
    var fileIterator = DriveApp.getFolderById( BACKUP_FOLDER_ID ).getFiles();
    while(fileIterator.hasNext()) {
      try {
        var file = fileIterator.next();
        var fileName = file.getName(); // get the name inside the try block

        // check the file date at the start of the file name against the cut date
        var dateParts = fileName
        .replace( /^(20[12]\d)([01]\d)([0123]\d)_([012]\d)([012345]\d)([012345]\d)_.*/, '$1-$2-$3-$4-$5-$6' ) 
        .split( '-' );
        // proper dates render an array of length 6, else skip the file
        if( dateParts.length === 6 ) {
          var backupDate = new Date( dateParts[0], dateParts[1] - 1, dateParts[2], dateParts[3], dateParts[4], dateParts[5], 0 );
          // if the file date is out of the range prune it!
          if( backupDate.getTime() < cutDate.getTime() ) {
            file.setTrashed(true);
            Logger.log( 'Outdated backup file trashed: ' + fileName );
          }
        }
      } catch( error ) {
        Logger.log( 'Could not prune backup file: ' + error.message );
        Logger.log( 'name: ' + fileName );
      }
    }
  }

}

