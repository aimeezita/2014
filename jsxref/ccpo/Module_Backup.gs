function backupBenchFile_cron() 
{
  
  var backupFolderId="0BzgUaAY0-dteclRubW5xcXlqV1k"; //Backup folder
  var logger=new CCPOLoggerClass("Backup Module");

  logger.log("About to make bench file backup.");
  backupFile_(getBenchSpreadsheetId(), backupFolderId) ;
  
  logger.log("About to make THIS script (codebase) backup.");
  backupFile_("1ORAs5Fi26nz3bJXGveJgwEKGZN5VcksfN9YRDqJMn-qPsIePi91YX2DC", backupFolderId) ;
  
  logger.log("About to make headcount spreadsheet backup.");
  backupFile_("1CvLiQF3DIOMJNIEItMK7FwxUkyKkwy_oaaKdMDJ2r2s", backupFolderId) ;
  
  
  logger.log("About to make birthday script (codebase) backup.");
  backupFile_("1EcW6nsfDfAr-SM_FXQG6yVsmXIckB0aFZWqKu7jGdqUXBZxBQd_Lo8vJ", backupFolderId) ;
  
  logger.log("About to make dashboard tickets backup.");
  backupFile_("0An-jcFMxy8_ydEdvb0kzQkZtNm1hdVM3cDNPVGFaSkE", backupFolderId) ;
  
  logger.log("About to make dashboard rec& sites backup.");
  backupFile_("0An-jcFMxy8_ydGhzWl8wc1RsU0V4MmE2SzNXM3NZQ3c", backupFolderId) ;

  logger.log("About to make Suggestion Module backup.");
  backupFile_("1U2XW6sLeuGh0IKb_cfRIJAYpKFWb88NiaZve8IVInp6pF2ucInx_Ww3a", backupFolderId) ;
  backupFile_("0AiPaPAJepRvRdEdyWGc1UHhSd1pKeXZnNlcyMmxtZXc", backupFolderId) ;
 
  // Backup Open Positions files
  backupFile_("0AiPaPAJepRvRdDhOYmhJNk9lbWhjOW9SYS0wV0ZaY0E", backupFolderId) ;
  backupFile_("1NSA-_FzzvIiiA2qA-Bgcjkh8ua0grO4l-ITLJZrb--C-c6HVstnGYcWq", backupFolderId) ;  
  
  logger.log("About to make LOGS backup.");
//  backupFile_("0AqajL6lY_OQndG53ZGRxWHBoQU1nRzFENjJNOXM2Y2c", backupFolderId) ;

  try{
  cleanBackupFiles_(20,backupFolderId);
  }
  catch(e)
  {
    throw "Cannot clean backup files";
  }
    
  logger.log("End bench file backup.");
}


///////////////////////////////////////////////////////////////
function backupFile_(sourceFileId, backupFolderId) 
{
  var file = DriveApp.getFileById(sourceFileId);
  var folder = DriveApp.getFolderById(backupFolderId);
  var currentDate = new Date();
  var backupFileNameFormat = currentDate.getFullYear()
                      + String("0" + (currentDate.getMonth()+1)).slice(-2)
                      + String("0" + currentDate.getDate()).slice(-2)
                      + "_" 
                      + String("0" + currentDate.getHours()).slice(-2)
                      + String("0" + currentDate.getMinutes()).slice(-2)
                      + String("0" + currentDate.getSeconds()).slice(-2)
                      + "_" 
                      + file.getName();

  Logger.log("Back-up: "+backupFileNameFormat);
  var backup = file.makeCopy(backupFileNameFormat,folder);
/*
  folder.addFile(backup);
  DriveApp.removeFile(backup);
*/
}

///////////////////////////////////////////////////////////////
function cleanBackupFiles_(numDaysToKeep, backupFolderId) 
{
  var backupfolder = DriveApp.getFolderById(backupFolderId);
  
  //A date in the past (hopefully) that marks the lower limit of backups to keep until today.
  var pruneUntilDate = new Date();
  pruneUntilDate.setDate(pruneUntilDate.getDate() - numDaysToKeep)
  Logger.log("Keeping all the files starting from: " + pruneUntilDate + " until today!");

  var filesWerePruned = 0;
  var fileIterator = backupfolder.getFiles();
  while(fileIterator.hasNext()) 
  {
    var file = fileIterator.next();

    //Take the pattern of the file's name and extract the date at the beginning.
    var fileNameSplitted = file.getName().replace(/(\d\d\d\d)(\d\d)(\d\d)_(\d\d)(\d\d)(\d\d)_(.*)/, "$1-$2-$3-$4-$5-$6-$7").split("-");
    var backupDate = new Date(fileNameSplitted[0], fileNameSplitted[1]-1, fileNameSplitted[2], fileNameSplitted[3], fileNameSplitted[4], fileNameSplitted[5], 0);

    //If the file falls below the range prune it!
    if(pruneUntilDate.getTime() > backupDate.getTime()) {
      Logger.log("This file is no longer needed and will be deleted: " + file.getName());
      file.setTrashed(true);

      filesWerePruned++;
    }
  }

  return filesWerePruned;
}
