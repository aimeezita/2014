function importFromEmail_cron() 
{
Logger.log("importFromEmail_cron");
  
  var importer=new ImporterClass_();
  Logger.log("importFromEmail");
  importer.importFromEmail();
Logger.log("END importFromEmail_cron");
}

////////////////////////////////////////
////////////////////////////////////////
function ImporterClass_ ()
{
  var logger=new CCPOLoggerClass("ImporterClass");
  

  this.importFromEmail =function () 
  {
    Logger.log("Check projects");
    var modified=this.importProjects();
    
    Logger.log("Check ticketsGlow");
    if (!modified) 
      modified=this.importTicketsGlow();
    
    
    //Esto de abajo deberia ser reemplazado por el TicketsGlow
    /******
    Logger.log("Check tickets");
    if (!modified) 
      modified=this.importTickets();
    *******/
    
    /* Removed 9/april/2014
    Logger.log("Check releases");
    if (!modified)
    modified=this.importReleases();
    */
    
    Logger.log("Check birthdays");
    if (!modified)
      modified=this.importBirthdayGlobers();
    Logger.log("Check globers");
    
    if (!modified)
      modified=this.importGlobers();
    
    
    Logger.log("Check ReleasesAllActualAndFuture");
    
    if (!modified)
      modified=this.importReleasesAllActualAndFuture();
    
    
    Logger.log("Check GloberSkills");
    
    if (!modified)
      modified=this.importGloberSkills();
    
    Logger.log("Check OUs");    
    if (!modified)
      modified=this.importOUs();
    
    Logger.log("Check Weekly Hours");    
    if (!modified)
      modified=this.weeklyHours();
  }


  ////////////////////////////////////////
  this.importReleasesAllActualAndFuture =function () 
  {
    var destSpreadsheet=getGlowImport2Spreadsheet();
    var modified=importFromEmail(destSpreadsheet,"AssignmentReportEndingFrom8DaysAgo", "ReleasesActualAndFuture", "AssignmentReportEndingFrom8DaysAgo.csv", true);
    if (modified)
    {
      //Sync Releases to all sheets
      logger.log("sync ReleasesActualAndFuture");
      var sourceSheet=destSpreadsheet.getSheetByName("ReleasesActualAndFuture");
      var destSheet = getReleasesSheet() ;
    }
    return modified;
  }

  ////////////////////////////////////////
  this.importReleases =function () 
  {
    var destSpreadsheet=getGlowImport2Spreadsheet();
    var modified=importFromEmail(destSpreadsheet,"AssignmentsReport", "Releases", "AssignmentsReport.csv", true);
    if (modified)
    {
    }
    return modified;
  }


  ////////////////////////////////////////
  this.importGloberSkills =function () 
  {
    var modified=importFromEmail(getGloberSkillsSpreadsheet(),"Globers Skills", "GloberSkills", "AllGlobersSkills.csv",true);
    if (modified)
    {
    
    }
    return modified;
  }

  ////////////////////////////////////////
  this.weeklyHours =function () 
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"Reporte de horas semanales", "WeeklyHours", "weeklyHours.csv",true);
    if (modified)
    {
    
    }
    return modified;
  }
  
  ////////////////////////////////////////
  this.importOUs =function () 
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"Organizational Units Report", "OrgUnits", "ouReport.csv",true);
    if (modified)
    {
    
    }
    return modified;
  }

  ////////////////////////////////////////
  this.importBirthdayGlobers =function () 
  {
    var modified=importFromEmail(getGlowImportSpreadsheet(),"Report: Birthday Globers", "BirthdayGlobers", "BirthdayGlobers.csv");
    if (modified)
    {
    
    }
    return modified;
  }
  
  ////////////////////////////////////////
  /*
  this.importTickets =function () 
  {
    var modified=importFromEmail(getGlowImportSpreadsheet(),"Sincronizacion Tickets-Planilla", "TicketsTS-Automatic", "SincronizacionTickets-Planilla.csv", true);
    if (modified)
    {
    
    }
    return modified;
  }
  */
  
  ////////////////////////////////////////
  this.importTicketsGlow =function () 
  {
    var modified=importFromEmail(getGlowImport2Spreadsheet(),"TicketsGlow", "TicketsGlow", "TicketsGlow.csv", true);
    if (modified)
    {
      var computation=new CCPOTicketsProcessingClass();
      computation.syncTicketsWithGlow("dario.robak@globant.com,nicolas.gerpe@globant.com");
    }
    return modified;
  }
  

  ////////////////////////////////////////
  this.importProjects =function () 
  {
    var destSpreadsheet=getGlowImportSpreadsheet();
    var modified=importFromEmail(destSpreadsheet,"Report: projects", "Projects", "AllProjectsWithPMsAndPgMs.csv", true);
    if (modified)
    {
      //Sync Projects to all sheets
      logger.log("sync projects");
      var sourceSheet=destSpreadsheet.getSheetByName("Projects");
      var destSheet = getBenchSpreadsheet().getSheetByName("Projects");
      copySheet(sourceSheet,destSheet);
      
      destSheet = getPublicProjectSheet();
      copySheet(sourceSheet,destSheet);
      
      //destSheet = getReleasesProjectsSheet();
      //copySheet(sourceSheet,destSheet);
      
      //destSheet = getProjectDispersionSpreadsheet().getSheetByName("Projects");;
      //copySheet(sourceSheet,destSheet);
    }
    return modified;
  }
  
  
  
  ////////////////////////////////////////
  this.importGlobers =function () 
  {
    var destSpreadsheet=getGlowImportSpreadsheet();
    var modified=importFromEmail(destSpreadsheet,"Report: globers", "Globers", "ProductionsGlobers.csv", true);
    if (modified)
    {
    
      //Sync Globers to all sheets
      logger.log("sync Globers to bench file");
      var sourceSheet=destSpreadsheet.getSheetByName("Globers");
      var destSheet = getBenchSpreadsheet().getSheetByName("Globers");
      copySheet(sourceSheet,destSheet);
      
      //logger.log("sync Globers to dispersion");
      //destSheet = getProjectDispersionSpreadsheet().getSheetByName("Globers");
      //copySheet(sourceSheet,destSheet);
      //END Sync Globers to all sheets
    }
    return modified;
  }
  
  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////
  
  function importFromEmail(destSpreadsheet,subject, sheetName, attachmentName, runOptimized) 
  {
    var imported=false;
    
    var threads = GmailApp.search('subject:"'+subject+'" has:attachment in:inbox', 0, 1);
    if (threads.length==0)
    {
      Logger.log("No Emails");
      return false;
    }
    Logger.log("Emails:"+threads.length);
    var label = GmailApp.getUserLabelByName("processed");
    var destSheet = destSpreadsheet.getSheetByName(sheetName);
    assert(destSheet,"importFromEmail: Sheet "+sheetName+" not found")

    
    for (var x=0; x<threads.length; x++) 
    {      
      var messages = threads[x].getMessages();
      Logger.log(threads[x].getFirstMessageSubject());
      for (var y=0; y<messages.length; y++) 
      {
        var attachments = messages[y].getAttachments();
        for (var z=0; z<attachments.length; z++) 
        {
          var file = attachments[z];
          if (file.getName()!=attachmentName)
            continue;
          
          logger.log("importing file:"+file.getName() );
          var strData=file.getDataAsString();
          
          
          if (runOptimized)
          {
            logger.log("Running optimized");
            var utilities = new CSVUtilitiesClass(",", "\r\n");
            utilities.importCsvToSheet(destSheet, strData);
          }
          else
          {
            var values=CSVToArray(strData);
            
            //Logger.log(values[0].length);
            //Logger.log(values[values.length-1]);
            //Logger.log(values[1]);
            
            // REMOVE TRAILING RECORDS 
            while (values.length>0 && (values[values.length-1].length<values[0].length))
            values=values.slice(0,values.length-1);
            if (values.length==0) continue;
            // end REMOVE TRAILING RECORDS 
            
            destSheet.clear();
            destSheet.getRange(1,1,values.length,values[0].length).setValues(values);  
            
          }
          imported=true;
        }       
      }
      
      if (imported)
      {
        threads[x].markRead();
        //threads[x].addLabel(label);
        //threads[x].moveToArchive();
        threads[x].moveToTrash(); //will be kept 30 days and then removed by gmail itself
      }
    }  
    return imported;
  }
  
  
}


///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
/* Use with Care!!!   


function testDeleteOldMail_()
{
   deleteOldMail_("processed", 5);

}

function deleteOldMail_(labelName, days) 
{
  Logger.log("start");
  if (!days) throw ("deleteOldMail: invalid time");
  
  if (!labelName) throw ("deleteOldMail: invalid label");
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) throw ("deleteOldMail: invalid label"); //check label exists

  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate()-days);
  
  var filter='label:"'+labelName+'" older_than:'+days+'d';
  Logger.log(filter);
  var threads = GmailApp.search(filter, 0, 5);
    
  for (var x=0; x<threads.length; x++) 
  {      
    var messages = threads[x].getMessages();
        Logger.log("Thread:"+threads[x].getFirstMessageSubject()+"/"+threads[x].getLastMessageDate());
    if (threads[x].getLastMessageDate()<maxDate)
      {
        Logger.log("delete!");
        //threads[x].moveToTrash();
      }
  }
    Logger.log("end");

}
*/
