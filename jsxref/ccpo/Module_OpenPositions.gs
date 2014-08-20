
/***********************************************************************************************/
// References 
// 1.- Normalised location process
/***********************************************************************************************/


/*************************************************************************************************/
/* Cron function. This function will be called by a scheduled, it should initialise a            */
/* process object instance and execute it.                                                       */
/*************************************************************************************************/
function OpenPositions_cron()
{
  var logger = new CCPOLoggerClass("OpenPositionProccess", "OpenPositionsLogs");
  logger.log("Start open positions proccess...");

  var process = new OpenPositionProccess();
  process._logger = logger;
  process.run();

  logger.log("Job complete.");
}



/*************************************************************************************************/
function OpenPositionProccess() {
  /***********************************************************************************************/
  /* Private constants ***************************************************************************/
  /***********************************************************************************************/
  this._normaliseLocationProcess = new NormaliseLocationProcess();
  this._HISTORIC_SHEET = getOpenPositionsHistoricSheet();
  this._logger;
  this._clientDescriptionsCache;
  this._positionDescriptionsCache;
  this._availableAntCache;
  this._locationDescriptionsCache;
  this._Months = {"january" : 0, "february" : 1, "march" : 2, "april" : 3, "may": 4, "june" : 5,
                  "july" : 6, "august" : 7, "september" : 8, "october" : 9, "november" : 10, "december" : 11}
  
  /***********************************************************************************************/
  /* Public methods ******************************************************************************/
  /***********************************************************************************************/
  
  this.run = function(){
    var listTickets = [],
        listHistoricTickets,
        listTicketsPublished;
    try{
      this._log("/******** PROCCESS START ***********/");
      
      this._log("/******** Backup Available sheet ***********/");
      this.backUp();
      
      this._log("/******** Initialise the object maps ***********/");
      this.init();
      
      this._log("/******** Get open possitions ***********/");
      listTickets = this.getOpenPositions();
      
      this._log("/******** Print open possitions ***********/");
      this.printResults(listTickets);
      
      this._log("/******** Get historic tickets ***********/");
      listHistoricTickets = this.getListHistoricTickets(listTickets);
      
      this._log("/******** Print historic tickets ***********/");
      this.printHistoricTickets(listHistoricTickets);
      
      this._log("/******** Finished CORRECT ***********/");
      
      
      /*
       * Send all applicants to Staff area
       */
  //    this._sendGlobersToStaff();
      /**/
      
      /*
       * Newsletter. Send all new positions to registered globers.
       */
  //    this._sendPositionsToGlobers();      
    }
    catch(ex){
      this._log("/******** Finished INCORRECT ***********/");
      this._log(ex);
      throw ex;
    }
    
    
  };
  
  this.init = function(){
    this._clientDescriptionsCache = this._getMapClientDescriptions();
    this._positionDescriptionsCache = this._getMapPositionDescriptions();
    this._availableAntCache = this._getMapAvailableAntDescriptions();
    this._locationDescriptionsCache = this._getMapLocationDescriptions();
  }
  
  this.backUp = function(){
    var spreadsheet = getOpenPositionsSpreadsheet();
    var availableAntSheet = getOpenPositionsAvailablePreviousSheet();
    var availableSheet = getOpenPositionsAvailableSheet();
    
    //Delete Available.previous if exists
    if (availableAntSheet) getOpenPositionsSpreadsheet().deleteSheet(availableAntSheet);
    //Rename Available to Available.previous
    availableSheet.setName("Available.previous");
    //Set Available.previous the active sheet
    spreadsheet.setActiveSheet(availableSheet);
    //Move Available sheet at the end
    spreadsheet.moveActiveSheet(spreadsheet.getNumSheets());
    //Create a new Available sheet
    var newsheet = getOpenPositionsSpreadsheet().insertSheet(0);
    newsheet.setName("Available");
    //Set Available the active sheet
    spreadsheet.setActiveSheet(newsheet);
    
    //BackUp de headers
    var lastColumn = availableSheet.getLastColumn();
    var headersRange = availableSheet.getRange(1, 1, 1, lastColumn);
    var headers = headersRange.getValues();
    
    newsheet.getRange(1, 1, 1, lastColumn).setValues(headers);
    headersRange.copyFormatToRange(newsheet, 1, lastColumn, 1, 1);
  };
  
  this.getOpenPositions = function(){
    var listTickets = [],
        mapTicketsDescriptions,
        mapClientDescriptions,
        mapPositionDescriptions;
    
    this._log("-Get list tickets");    
    listTickets = this.getListTickets();
    this._log("-list tickets count = " + listTickets.length);
    
    this._log("-Group tickets"); 
    listTickets = this.groupListTickets(listTickets);
    
    this._log("-Update tickets values"); 
    this.updateListTickets(listTickets);
    this._log("-New tickets count = " + listTickets.length); 
    
    return listTickets;
  };
  
  this.getListTickets = function(){
    
    var i, ticket, listTickets = [], objectMapped;
    var ticketsSheet = getOpenPositionsTicketsSourceSheet();
    var ticketsValues = getRows(ticketsSheet);
    
    for (i in ticketsValues){
      if (toUpper(ticketsValues[i]["OpenPosition"]) == "YES"){
        //searching... locationDescription
        objectMapped = this._locationDescriptionsCache.get(ticketsValues[i]);
        var locationDescription = (objectMapped)? objectMapped["Description"]:"";
        //
        
        ticket = new Ticket();
        ticket.number = ticketsValues[i]["Number"];//stripHashTag
        ticket.client = ticketsValues[i]["Client"];
        ticket.project = ticketsValues[i]["Project"];
        ticket.name = ticketsValues[i]["Name"];
        ticket.skill = ticketsValues[i]["Position"];
        ticket.seniority = ticketsValues[i]["Seniority"];
        ticket.location = locationDescription; 
        ticket.openPosition = ticketsValues[i]["OpenPosition"]; 
        ticket.cluster = ticketsValues[i]["Cluster"]; 
        ticket.cluster = this._normalizeCluster(ticketsValues[i]["Work Office"]);
        
        listTickets.push(ticket);
       
      }  
    }
    return listTickets;
  };
  
  
  this.updateListTickets = function(listTickets){
    var mapTicketDescriptions = this._availableAntCache,
        mapPositionDescriptions = this._positionDescriptionsCache;
    
    var i, ticket,catalogPositionDescription,
         positionDescriptionAnt, publish, objectMapped;
    
    for (i in listTickets){
      
      ticket = listTickets[i];
      
      //Obtain the position description of the catalog
      objectMapped = mapPositionDescriptions.get(ticket);
      if (objectMapped)
        catalogPositionDescription = objectMapped["Description"];
      else
        catalogPositionDescription = undefined;
      
      objectMapped = mapTicketDescriptions.get(ticket);
      if (objectMapped){
        
        //Obtain the publishFlag  of the "Available.previous"
        publish = objectMapped["Publish online"];
        
        //Obtain the position description of the "Available.previous"
        positionDescriptionAnt = objectMapped["Position Description"];
        
      }
      else{
        publish = undefined;
        positionDescriptionAnt = undefined;
      }
      
      //Update position description
      if(positionDescriptionAnt && positionDescriptionAnt !=""){
        ticket.positionDescription = positionDescriptionAnt;
      }
      else{
        if (catalogPositionDescription) ticket.positionDescription = catalogPositionDescription;
      }
      
      //Update publish flag
      if (publish) ticket.publish = publish;
      
    }

  };
  
  this.groupListTickets = function(listTickets){
    var i, mapTickets = {}, key, ticket, newList = [], properties;
    
    for (i in listTickets){
      ticket = listTickets[i];
      key = this._getTicketKey(ticket);
      if (!mapTickets[key]){ 
        mapTickets[key] = [ticket.number, ticket.name, ticket.client, ticket.project,
                           ticket.skill, ticket.seniority, ticket.location, ticket.cluster];
      }
      else{
        mapTickets[key][0] = mapTickets[key][0] + ", " + ticket.number;
      }
    }
    
    for (i in mapTickets){
      //properties = i.split("@");
      ticket = new Ticket();
      ticket.number = mapTickets[i][0];
      ticket.name = mapTickets[i][1];
      ticket.client = mapTickets[i][2];
      ticket.project = mapTickets[i][3];
      ticket.skill = mapTickets[i][4];
      ticket.seniority = mapTickets[i][5];
      ticket.location = mapTickets[i][6];
      ticket.cluster = mapTickets[i][7];
      newList.push(ticket);
    }
    return newList;
  };
  
  
  this.printResults = function(listTickets){
    
    var availableSheet = getOpenPositionsAvailableSheet();
    var results = [], item = [], ticket,i, j, range;
    
    for (i in listTickets){
      ticket = listTickets[i];
      item = [ticket.number, ticket.name, ticket.client, ticket.project, ticket.skill, ticket.seniority, ticket.location, ticket.cluster, ticket.positionDescription, ticket.publish];
      results.push(item);
    }
    
    range = availableSheet.getRange(2, 1, availableSheet.getLastRow(), availableSheet.getLastColumn());
    range.clear();
    if (results.length > 0){
      range = availableSheet.getRange(2, 1, results.length, results[0].length);
      range.setValues(results);
    }
    
    //Resize column Position Description
    var newColumnNdx = getHeaderIndexes(availableSheet)["Position Description"];
    availableSheet.autoResizeColumn(newColumnNdx);
    
  };
  
  this.getListHistoricTickets = function(listTickets){
    
    var listHistoricTickets = [], listNewOpenPositions = [];
    
    listHistoricTickets = this._getHistoricTickets();
    this._log("-get tickets in historic sheet,count = " + listHistoricTickets.length);
    
    this._log("-set first Date in available sheet");
    listNewOpenPositions = this.setFirstDateInAvailableSheet(listTickets, listHistoricTickets);
    
    this._log("-notify to PMs and Technical leaders: " + listNewOpenPositions.length);
    this.notifyToPmsAndTds(listNewOpenPositions);
    
    this._log("-set last Date in available sheet");
    this.setLastPublishDate(listTickets, listHistoricTickets)
    
    this._log("listHistoricTickets count: " + listHistoricTickets.length);
    return listHistoricTickets;
  };
  
  this.setLastPublishDate =  function(listTickets, listHistoricTickets){
    var i, historicTicket, lastPublishDate, firstPublisDate, toDay = new Date(), count = 0, clientDescriptionOjectMapped, availableAntObjectMapped;
    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      firstPublisDate = historicTicket["firstPublishDate"]
      lastPublishDate = historicTicket["lastPublishDate"];
      if (firstPublisDate && (!lastPublishDate || lastPublishDate == "")){
        if (!this._existsHistoricTicketInListTickets(historicTicket,listTickets)){
          clientDescriptionOjectMapped = this._clientDescriptionsCache.get(historicTicket);
          availableAntObjectMapped = this._availableAntCache.get(historicTicket);
          historicTicket["lastPublishDate"] = toDay;
          historicTicket["clientDescription"] = (clientDescriptionOjectMapped) ? clientDescriptionOjectMapped["Description"]: "";
          historicTicket["positionDescription"] = (availableAntObjectMapped) ? availableAntObjectMapped["Position Description"]: "";
          count++;
        }
      }
    }
    this._log("-tickets with last Date in available, count = " + count);
  }
  
  this.notifyToPmsAndTds = function(newOpenPositions){
    var i, listResults = [], ticket;
    for (i in newOpenPositions){
      ticket = newOpenPositions[i];
      listResults.push(
          [
            ticket.number,
            ticket.name,
            ticket.client,
            ticket.project,
            ticket.skill,
            ticket.seniority,
            ticket.location,
            ticket.clientDescription,
            ticket.positionDescription,
            ticket.publish,
            ticket.cluster
          ]);
    }
    this._notifyToPMTD(listResults);
  }
  
  this.setFirstDateInAvailableSheet = function(listTickets, listHistoricTickets){
    var i, ticket, historicTicket, toDay = new Date(), listNewOpenPositions = [];
    for (i in listTickets){
      ticket = listTickets[i];
      historicTicket = this._existsTicketInListHistoricTickets(ticket,listHistoricTickets);
      if (!historicTicket){
        
        var newHistoricTicket = new HistoricTicket();
        newHistoricTicket.number = ticket.number;
        newHistoricTicket.name = ticket.name;
        newHistoricTicket.client = ticket.client;
        newHistoricTicket.project = ticket.project;
        newHistoricTicket.position = ticket.skill;
        newHistoricTicket.seniority = ticket.seniority;
        newHistoricTicket.workOffice = ticket.location
        newHistoricTicket.cluster = ticket.cluster;
        newHistoricTicket.firstDateInAvailable = toDay;
        listHistoricTickets.push(newHistoricTicket);
        listNewOpenPositions.push(ticket);
        
      }
    }
    this._log("-tickets with first Date in available, count = " + listNewOpenPositions.length);
    return listNewOpenPositions;
  }
  
  this.printHistoricTickets = function(listHistoricTickets){
    
    var results = [], item = [], historicTicket,i, range;
    
    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      item = [historicTicket.number, historicTicket.name, historicTicket.client, historicTicket.project, historicTicket.position, historicTicket.seniority, historicTicket.workOffice, historicTicket.cluster, historicTicket.clientDescription, historicTicket.positionDescription, historicTicket.firstDateInAvailable, historicTicket.firstPublishDate, historicTicket.lastPublishDate];
      results.push(item);
    }
    
    range = this._HISTORIC_SHEET.getRange(2, 1, this._HISTORIC_SHEET.getLastRow(), this._HISTORIC_SHEET.getLastColumn());
    range.clear();
    if (results.length > 0){
      range = this._HISTORIC_SHEET.getRange(2, 1, results.length, results[0].length);
      range.setValues(results);
    }
    
    
  };
  
  /***********************************************************************************************/
  /* Public methods for populate the widget ******************************************************/
  /***********************************************************************************************/
  this.getListHistoricTicketsByYearAndMonth = function(year, month){
    
    year = parseInt(year);
    month = this._Months[month];
    
    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, historicTicket, listResults = [], lastPublishDate;
    
    for (i in historicValues){
      historicTicket = historicValues[i];
      lastPublishDate = historicTicket["Last publish date"];
      if (lastPublishDate){
        var firstPublishDate = historicTicket["First publish date"];
        var ticketYear = firstPublishDate.getFullYear();
        var ticketMonth = firstPublishDate.getMonth();
        if (year == ticketYear && month == ticketMonth){
          listResults.push(
            [
              historicTicket["Number"],
              historicTicket["Name"],
              historicTicket["Client"],
              historicTicket["Project"],
              historicTicket["Position"],
              historicTicket["Seniority"],
              historicTicket["Work Office"],
              historicTicket["Client Description"],
              historicTicket["Position Description"],
              "YES",
              historicTicket["Cluster"]
            ]);
        }
      }
    }
    
    return listResults;
    
  }
  this.getListTicketsForPublish = function(){
    
    var openPositionsSheet = getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(openPositionsSheet);
    var i, listResults=[];
    this.init();
    for (i in openPositionsValues){
      
      if (toUpper(openPositionsValues[i]["Publish online"]) == "YES"){
        var objectMapped = this._clientDescriptionsCache.get(openPositionsValues[i]);
        var clientDescription = (objectMapped)? objectMapped["Description"] : "";
        listResults.push(
          [
            openPositionsValues[i]["Number"],
            openPositionsValues[i]["Name"],
            openPositionsValues[i]["Client"],
            openPositionsValues[i]["Project"],
            openPositionsValues[i]["Position"],
            openPositionsValues[i]["Seniority"],
            openPositionsValues[i]["Work Office"],
            clientDescription,
            openPositionsValues[i]["Position Description"],
            openPositionsValues[i]["Publish online"],
            openPositionsValues[i]["Cluster"]
          ]);
      }
    }

    return listResults;
    
  };
  
  /**************Update descriptions****GET***/
  this.getAllTickets=function(){
    var i;
    var availableSheet=getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(availableSheet);
    this.init();
    for (i in openPositionsValues){
      var objectMapped = this._clientDescriptionsCache.get(openPositionsValues[i]);
      var clientDescription = (objectMapped)? objectMapped["Description"] : "";
      openPositionsValues[i]["Client Description"]=clientDescription;
    }
    return openPositionsValues;
  };
  /**************Update descriptions***SET****/
  this.updateDescription=function(rowTicket){
    var i;
    var availableSheet=getOpenPositionsAvailableSheet();
    var openPositionsValues = getRows(availableSheet);
    
    this.init();
    //******Create map for tickets in available
    var mapObject = new Cache();
    var availableSheet = getOpenPositionsAvailableSheet();
    var ticketsDescriptionValues = getRows(availableSheet);
    mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
    //************************************************
    
    //for (i in openPositionsValues){
        var ticket = mapObject.get(rowTicket);
      Logger.log(ticket);
        //var objectMapped = this._clientDescriptionsCache.get(ticket);
    //}
  };

  /**************Validate access***Security****/
  this.validateUserAccess = function(userId){
    return false;
  };
  
  this.getListTicketsPublishedToday = function(){
    
    this.init();
    //******Create map for tickets in available
    var mapObject = new Cache();
    var availableSheet = getOpenPositionsAvailableSheet();
    var ticketsDescriptionValues = getRows(availableSheet);
    mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
    //************************************************
    
    //var openPositionsSheet = getOpenPositionsAvailableSheet();
    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, listResults=[], today = new Date();
    
    today.setHours(00,00,00,00);
    
    for (i in historicValues){
      
      var publishedDay = historicValues[i]["First publish date"];
      var lastPublishedDay = historicValues[i]["Last publish date"];
      if(publishedDay && publishedDay != "" && !lastPublishedDay ){
        
        publishedDay.setHours(00,00,00,00);
        if(!(publishedDay - today)){ 
          //If the dates are equals then insert into the list of results
          var ticket = mapObject.get(historicValues[i]);
          var objectMapped = this._clientDescriptionsCache.get(ticket);
          var clientDescription = (objectMapped)? objectMapped["Description"] : "";
          if (toUpper(ticket["Publish online"]) == "YES"){
            listResults.push(
            [
              ticket["Number"],
              ticket["Name"],
              ticket["Client"],
              ticket["Project"],
              ticket["Position"],
              ticket["Seniority"],
              ticket["Work Office"],
              clientDescription,
              ticket["Position Description"],
              ticket["Publish online"],
              ticket["Cluster"]
            ]);
          }
          
        }
      }
      
    }

    return listResults;
    
  };
  
  /***********************************************************************************************/
  /* Private methods *****************************************************************************/
  /***********************************************************************************************/
  this._notifyToPMTD = function (listPositions) {
    //var logger = new CCPOLoggerClass("Module_Notify_OP", "OpenPositionsLogs");
    var ssProjects = getOpenPositionsProjectsSourceSheet();
    var ssRows = getRows(ssProjects);
    var i, idList, eMail, cntOK = 0;
    var tmpMails = "";
    this._log("Benche length = " + ssRows.length);
    this._log("listPositions length = " + listPositions.length);
    
    if ( (listPositions!=null && listPositions.length>0) && 
        (ssRows!=null && ssRows.length>0) ) {
      for (i in listPositions) {
        idList = this._searchSpecificProject(ssRows, "Project", listPositions[i][3]);
        if (idList!=null) {
          listPositions[i][12] = this._isNull(ssRows[idList]["Current Program Managers"]);
          listPositions[i][13] = this._delHyphen(this._isNull(ssRows[idList]["Current Program Managers Emails"]));
          listPositions[i][14] = this._isNull(ssRows[idList]["Current Project Managers"]);
          listPositions[i][15] = this._delHyphen(this._isNull(ssRows[idList]["Current Project Managers Emails"]));
          listPositions[i][16] = this._isNull(ssRows[idList]["Current Technical Leaders"]);
          listPositions[i][17] = this._delHyphen(this._isNull(ssRows[idList]["Current Technical Leaders Email"]));
          listPositions[i][18] = this._isNull(ssRows[idList]["Current Technical Director"]);
          listPositions[i][19] = this._delHyphen(this._isNull(ssRows[idList]["Current Technical DirectorEmail"]));
          // Send email
          eMail = this._getValidEmail(listPositions[i]);
          if ( eMail!="" ) {
            tmpMails += i + ":" + eMail + " *** ";
            eMail = "nicolas.gerpe@globant.com";
            this._sendMail(eMail, 'Update Descriptions of Open Positions', this._getBodyDescriptions(listPositions[i]));
            //MailApp.sendEmail(eMail, 'Update Descriptions of Open Positions', '', {htmlBody : this._getBodyDescriptions(listPositions[i]), name: "pmo-staffing@globant.com", replyTo: "pmo-staffing@globant.com"});
            cntOK += 1;
          } else {
            this._log("El PM y el TD del ticket " + listPositions[i][0] + " (rowProjects="+idList+"+2rows) no cuentan con correo electronico.");
          }
        }
      }
    }
    
    this._log("Total de Correos Enviados = " + cntOK);
  }
  
  this._searchSpecificProject = function(rowsSpreadSheet, columnName, value) {
    var i, tmp, listResults=[];
    value = value==null?"":value.trim().toLowerCase();
    for (i in rowsSpreadSheet) {
      tmp = rowsSpreadSheet[i][columnName]==null?"":rowsSpreadSheet[i][columnName].trim().toLowerCase();
      if (tmp == value) {
        return i;
      }
    }
    return null;
  }
  
  this._sendGlobersToStaff = function() {
    this._log("Start sendGlobersToStaff !!");
    var isRequiredAllGlobers = false;
    var listGlobers = this._appliedOPForGlobers();
    var staffingAreaEmails = this._getStaffingAreaEmails();

    if ( listGlobers!=null && (listGlobers.length>0) && 
      (staffingAreaEmails!=null) && (staffingAreaEmails!="") ) {
      var body = this._getBodyGlobers(listGlobers);
      for (i in staffingAreaEmails) {
        this._sendMail(staffingAreaEmails[i], "New globers applied to an open position", body);
      }
    }
    
    this._log("Finish sendGlobersToStaff !!");
  }
  
  this._sendPositionsToGlobers = function () {
    this._log("Start sendPositionsToGlobers !!");
    
    var i, cntMails=0, isRequiredAllGlobers = true;
    var process = new OpenPositionProccess();
    var listPositions = process.getListTicketsPublishedToday();
    var listGlobers = this._globersRegistered(isRequiredAllGlobers);
    
    if ( (listPositions!=null && (listPositions.length>0)) &&
      (listGlobers!=null && (listGlobers.length>0)) ) {
        var body = this._getBodyPositions(listPositions);
        for (i in listGlobers) {
          this._sendMail(listGlobers[i].user, "New Open Position!", body);
          cntMails += 1;
        }
      }
    
    this._log("Se enviaron " + cntMails + " correos");
    this._log("Finish sendPositionsToGlobers !!");
  }
  
  this._getStaffingAreaEmails = function() {
    var i, tmp;
    var spStaffingArea = getOpenPositionsStaffingAreaSheet();
    var staffingAreaValues = getRows(spStaffingArea);
    var emails = new Array();
    
    for (i in staffingAreaValues) {
      tmp = staffingAreaValues[i]["ID"].trim();
      if ( tmp!=null && tmp!="" ) {
        emails.push(tmp);
      }
    }
    
    return emails;
  }
  
  this._globersRegistered = function(isRequiredAllGlobers) {
    var spreadsheetGlobers = getOpenPositionsPositionsGlobersSheet();
    var globersValues = getRows(spreadsheetGlobers);
    var i, listResults=[], glober;
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);
    
    for (i in globersValues) {
      if ( isRequiredAllGlobers || (!isRequiredAllGlobers && (lastDay.valueOf() <= (new Date(globersValues[i]["Create Date"])).valueOf())) ) {
        glober = new Glober();
        glober.rowID = globersValues[i]["rowID"];
        glober.user = globersValues[i]["User Name"];
        glober.createDate = new Date(globersValues[i]["Create Date"]);
        listResults.push(glober);
      }
    }
    
    return listResults;
  }
  
  this._appliedOPForGlobers = function() {
    var ssApplyOPOffshore = getOpenPositionsPositionsApplyOPOffshoreSheet();
    var ssApplyOPOffshoreValues = getRows(ssApplyOPOffshore);
    var ssApplyOPOnsite = getOpenPositionsPositionsApplyOPOnsiteSheet();
    var ssApplyOPOnsiteValues = getRows(ssApplyOPOnsite);
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);
    var listResults=[];
    
    ssApplyOPOffshoreValues.sort(function(a , b){
      if (a["Ticket Number"] > b["Ticket Number"])
        return 1;
      if (a["Ticket Number"] < b["Ticket Number"])
        return -1
        if (a["Ticket Number"] == b["Ticket Number"])
          return 0;
    });
    ssApplyOPOnsiteValues.sort(function(a , b){
      if (a["TicketNumber"] > b["TicketNumber"])
        return 1;
      if (a["TicketNumber"] < b["TicketNumber"])
        return -1
        if (a["TicketNumber"] == b["TicketNumber"])
          return 0;
    });
    
    var lastOffshore = this._getLastOffONOP(ssApplyOPOffshoreValues);
    var lastOnsite = this._getLastOffONOP(ssApplyOPOnsiteValues);
    
    var tmp = [], g = [];
    for (var i=0; i<lastOffshore.length; i++) {
      if ( i>0 ) {
        if ( lastOffshore[i]["Ticket Number"] != lastOffshore[i-1]["Ticket Number"]) {
          tmp.push(lastOffshore[i-1]["Ticket Number"]);
          tmp.push(lastOffshore[i-1]["Client"]);
          tmp.push(lastOffshore[i-1]["Complete Name"]);
          tmp.push(g);
          listResults.push(tmp);
          g = [];
          tmp = [];
        }
      }
      g.push(lastOffshore[i]["Username"]);
      if ( i == lastOffshore.length-1 ) {
        tmp.push(lastOffshore[i]["Ticket Number"]);
        tmp.push(lastOffshore[i]["Client"]);
        tmp.push(lastOffshore[i]["Complete Name"]);
        tmp.push(g);
        listResults.push(tmp);
        g = [];
        tmp = [];
      }
    }
    
    tmp = [], g = [];
    for (var i=0; i<lastOnsite.length; i++) {
      if ( i>0 ) {
        if ( lastOnsite[i]["TicketNumber"] != lastOnsite[i-1]["TicketNumber"]) {
          tmp.push(lastOnsite[i-1]["TicketNumber"]);
          tmp.push(lastOnsite[i-1]["Client"]);
          tmp.push(lastOnsite[i-1]["Complete Name"]);
          tmp.push(g);
          listResults.push(tmp);
          g = [];
          tmp = [];
        }
      }
      g.push(lastOnsite[i]["Username"]);
      if ( i == lastOnsite.length-1 ) {
        tmp.push(lastOnsite[i]["TicketNumber"]);
        tmp.push(lastOnsite[i]["Client"]);
        tmp.push(lastOnsite[i]["Complete Name"]);
        tmp.push(g);
        listResults.push(tmp);
        g = [];
        tmp = [];
      }
    }
    
    return listResults;
  }

  this._getLastOffONOP = function (listOP) {
    var listResult = [];
    var oneDay = 1000*60*60*24;
    var lastDay = new Date(new Date().valueOf()-oneDay);
    
    for (var i=0; i<listOP.length; i++) {
      if ( lastDay.valueOf() <= (new Date(listOP[i]["Apply Date"])).valueOf() ) {
        listResult.push(listOP[i]);
      }
    }
    
    return listResult;
  }

  this._getBodyDescriptions = function(openPosition) {
    var body = "";
    
    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Open Positions for Globers</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";
    
    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"208\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 5px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\"color: #176bb4; font-size: 18px; font-weight: bold; line-height: 25px\">Update Descriptions </span><br /> <br />";
    body += "<ul>";
    body += "<p align = 'justify'>Position <strong>'" + openPosition[2] + " - " + openPosition[4] + " - " + openPosition[6] + "'</strong> belonging to one of your projects was selected to be published in the <a href='https://sites.google.com/a/globant.com/op/positions'>Open Positions public site</a>.</p>";
    body += "<p align = 'justify'>Please confirm that you want to publish it and please send to pmo-staffing@globant.com a client and position/skill description to make it more appealing for the globers.</p>";
    body += "</ul>";
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";
    
    return body;
  }
  
  this._getBodyPositions = function(listPositions) {
    /*******************************************/
    //Refactor list by ofshore and onsite
    var listOnSite = [], listOffShore = [];
    for (var i in listPositions){
      if (listPositions[i][10] == "offshore")
        listOffShore.push(listPositions[i]);
      else if (listPositions[i][10] == "onsite")
        listOnSite.push(listPositions[i]);
    }
    /*******************************************/
    var body = "";
    
    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Open Positions for Globers</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";
    
    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"208\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 15px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\" font-size: 16px; font-weight: bold; line-height: 25px\">These new positions were published in the Open Positions’ <a href='https://sites.google.com/a/globant.com/op/positions' target = '_blank'>site</a></span><br /><br />"
    if (listOffShore.length > 0){
      body += "<span style=\"color: #176bb4; font-size: 16px; font-weight: bold; line-height: 25px\">Positions Offshore </span><br />";
      body += "<ul>";
      for (var i = 0; i < listOffShore.length; i++) {
        body += "<li><strong>" + listOffShore[i][2] + " - " + listOffShore[i][4] + " - " + listOffShore[i][6] + "</strong></li>";
      }
      body += "</ul>";
    }
    if (listOnSite.length > 0){
      body += "<span style=\"color: #176bb4; font-size: 16px; font-weight: bold; line-height: 25px\">Positions Onsite </span><br />";
      body += "<ul>";
      for (var i = 0; i < listOnSite.length; i++) {
        body += "<li><strong>" + listOnSite[i][2] + " - " + listOnSite[i][4] + " - " + listOnSite[i][6] + "</strong></li>";
      }
      body += "</ul>";
    }
    body += "<br />";
    body += "To apply for these positions and view the complete list of openings,";
    body += "<a href=\"https://sites.google.com/a/globant.com/op/\" target=\"_blank\">click here</a>. <br />";
    body += "You can unsubscribe any time by unchecking the subscription box in the site<br/><br/>";
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";
    
    return body;
  }
  
  this._getBodyGlobers = function(listGlobers) {
    var i, g;
    var body = "";
    
    body += "<html>";
    body += "<head>";
    body += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />";
    body += "<title>Globers Register</title>";
    body += "</head>";
    body += "<body style=\"font-family: Arial, Helvetica, sans-serif; background-color: #CED9EC; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px;\">";
    
    body += "<table width=\"700\" border=\"0\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#ffffff\">";
    body += "<tr>";
    body += "<td height=\"184\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\">";
    body += "<img src=\"http://communications.globant.com/Comm/Recruiting/2013/OpenPositionsforGlobers/images/header2.png\" width=\"700\" height=\"278\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#fff\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 30px; padding-top: 5px; padding-left: 40px; padding-right: 40px; padding-bottom: 5px; text-align: center; color: #C0D72F; line-height: 30px;\">";
    body += "<strong>MASTERY | AUTONOMY | PURPOSE</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"30\" align=\"center\" valign=\"top\" bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 15px; padding-top: 5px; padding-left: 0px; padding-right: 0px; padding-bottom: 5px; text-align: center; color: #000; line-height: 20px;\">";
    body += "<strong>Take part in defining your future steps in Globant and tell us how you<br /> want to grow. Check out our Hot Openings!</strong>";
    body += "</td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td align=\"left\" valign=\"middle\" bgcolor=\"#C0D72F\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 18px; padding-top: 15px; padding-bottom: 15px; padding-left: 80px; font-weight: bold;\"></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"100\" align=\"center\" valign=\"top\" bgcolor=\"#C0D72F\">";
    body += "<table width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    body += "<tr>";
    body += "<td bgcolor=\"#FFFFFF\" style=\"font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding-top: 5px; padding-left: 33px; padding-right: 10px; padding-bottom: 0px; text-align: left; color: #000; line-height: 20px;\">";
    body += "<span style=\"color: #176bb4; font-size: 18px; font-weight: bold; line-height: 25px\">Applied Open Positions </span><br /> <br />";
    body += "<ul>";
    for (var i = 0; i<listGlobers.length; i++) {
      var ticket = listGlobers[i][0];      
      var client = listGlobers[i][1];
      var name = listGlobers[i][2];
      var globers = listGlobers[i][3];      
      body += "<li> Ticket Number: " + ticket + ", " + client + ", " + name + "</li>";
      for (var j = 0; j<globers.length; j++) {
        body += "<ul>";
        body += "<li>" + globers[j] + "</li>";
        body += "</ul>";
      }
    }
    body += "</ul><br>";
    body += "<p>To check more details on the applicants check the ‘ApplyOPOnsite’ and ‘ApplyOPOffshore’ sheet <a href=\"https://docs.google.com/a/globant.com/spreadsheet/ccc?key=" + getOpenPositionsSpreadsheetId() + "&usp=drive_web#gid=10\">here</a></p>"
    body += "</td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td height=\"45\" colspan=\"3\" align=\"center\" valign=\"top\" bgcolor=\"#000000\">";
    body += "<table width=\"700\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"347\" bgcolor=\"#000000\">";
    body += "<table width=\"276\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"112\" style=\"font-family: Arial, Helvetica, sans-serif; color: #cccccc; font-size: 12px; padding: 10px 10px 10px 20px; line-height: 16px;\">Follow us on:</td>";
    body += "<td width=\"164\">";
    body += "<table width=\"135\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    body += "<tr>";
    body += "<td width=\"35\"><a href=\"http://www.facebook.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/facebook.jpg\" alt=\"Facebook\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.twitter.com/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/tw.jpg\" alt=\"Twitter\" width=\"30\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"34\"><a href=\"http://www.youtube.com/Globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/yt.jpg\" alt=\"YouTube\" width=\"31\" height=\"28\" border=\"0\" /></a></td>";
    body += "<td width=\"32\"><a href=\"http://www.linkedin.com/company/globant\" target=\"_blank\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/in.jpg\" alt=\"Linkedin\" width=\"29\" height=\"28\" border=\"0\" /></a></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "</tr>";
    body += "</table></td>";
    body += "<td width=\"243\" align=\"right\" bgcolor=\"#000000\"><img src=\"http://communications.globant.com/Comm/footers-templates/images/globant.jpg\" alt=\"Globant\" width=\"167\" height=\"41\" border=\"0\" /></td>";
    body += "</tr>";
    body += "<tr>";
    body += "<td bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">";
    body += "<a href=\"http://www.globant.com\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Home</a>";
    body += "| <a href=\"https://docs.google.com/a/globant.com/spreadsheet/viewform?formkey=dC1rNmozRGtzY0tzX0EyNVBPdHcya3c6MQ#gid=0\" target=\"_blank\" style=\"color: rgb(240, 240, 240); font-weight: normal; text-decoration: underline;\">Send us your feedback!</a>";
    body += "</td>";
    body += "<td align=\"right\" bgcolor=\"#000000\" style=\"font-family: Arial, Helvetica, sans-serif; color: #eeeeee; font-size: 10px; padding: 5px 5px 5px 20px; line-height: 16px;\">(c) 2014 Globant. All rights reserved.</td>";
    body += "</tr>";
    body += "</table>";
    body += "</td>";
    body += "</tr>";
    body += "</table>";
    body += "</body>";
    body += "</html>";
    
    return body;
  }

  this._sendMail = function (to, subject, body) {
    this._log("Sending mail to: " + to);
    GmailApp.sendEmail(to, subject, '', {htmlBody : body, name: "pmo-staffing@globant.com", replyTo: "pmo-staffing@globant.com"});
  }
  
  this._isNull = function(strValue) {
    return strValue==null?"":strValue.trim();
  }

  this._delHyphen = function(strValue) {
    return strValue.replace(/ - /g, ", ");
  }
  
  this._getValidEmail = function (openPosition) {
    var eMail = "";
    var previousEmail = false;
    
    if ( openPosition[15]!="" ) {
      eMail += openPosition[15];
      previousEmail = true;
    }
    if ( openPosition[19]!="" ) {
      if ( previousEmail ) eMail += ",";
      eMail += openPosition[19];
    }
    
    return eMail;
  }

  
  this._getMapClientDescriptions = function(){
    var mapObject = new Cache();
    var clientDescriptionSheet = getOpenPositionsClientDescriptionsSheet();
    var clientDescriptionValues = getRows(clientDescriptionSheet);
    
    mapObject.init(clientDescriptionValues,this._clientDescriptionHashFunction);
    return mapObject;
  };
  
  this._getMapPositionDescriptions = function(){
    var mapObject = new Cache();
    var positionDescriptionSheet = getOpenPositionsPositionsDescriptionsSheet();
    var positionDescriptionValues = getRows(positionDescriptionSheet);
    
    mapObject.init(positionDescriptionValues, this._positionDescriptionHashFunction);
    return mapObject;
  };
  
  this._getMapAvailableAntDescriptions = function(){
   var mapObject = new Cache();
   var availableAntSheet = getOpenPositionsAvailablePreviousSheet();
   var ticketsDescriptionValues = getRows (availableAntSheet);
    
   mapObject.init(ticketsDescriptionValues, this._ticketDescriptionHashFunction);
   return mapObject;
  };
  
  this._getMapLocationDescriptions = function(){
    var mapObject = new Cache();
    var locationDescriptionSheet = getOpenPositionsLocationDescriptionsSheet();
    var locationDescriptionValues = getRows(locationDescriptionSheet);
    
    mapObject.init(locationDescriptionValues, this._locationDescriptionHashFunction);
    return mapObject;
  };
  
  this._normalizeCluster = function(location){
    var result;
    /*var site = toLower(cluster);
    if (site == "onsite" || site == "offshore"){
      result = site;
    }*/
    if(toUpper(location) === "ANYWHERE"){
      result = "offshore";
    }
    else if (this._normaliseLocationProcess.compatibleLocations("EU", location)){
      result = "onsite";
    }
    else if (this._normaliseLocationProcess.compatibleLocations("UK", location)){
      result = "onsite";
    }
    else{
      result = "offshore"
    }
    return result;
  };
  
  this._getHistoricTickets = function(){
    
    var historicValues = getRows(this._HISTORIC_SHEET);
    var i, key, historicTicket, listHistoricTickets=[];
    
    for (i in historicValues){
      historicTicket = new HistoricTicket();
      historicTicket.number = historicValues[i]["Number"];
      historicTicket.name = historicValues[i]["Name"];
      historicTicket.client = historicValues[i]["Client"];
      historicTicket.project = historicValues[i]["Project"]; 
      historicTicket.position = historicValues[i]["Position"];
      historicTicket.seniority = historicValues[i]["Seniority"];
      historicTicket.workOffice = historicValues[i]["Work Office"];
      historicTicket.cluster = historicValues[i]["Cluster"];
      historicTicket.clientDescription = historicValues[i]["Client Description"];
      historicTicket.positionDescription = historicValues[i]["Position Description"];
      historicTicket.firstDateInAvailable = historicValues[i]["First date in Available"];
      historicTicket.firstPublishDate = historicValues[i]["First publish date"];
      historicTicket.lastPublishDate = historicValues[i]["Last publish date"];
      
      key = //historicTicket.name + "@" +
            historicTicket.client + "@" +
            //historicTicket.project + "@" +
            historicTicket.position + "@" +
            historicTicket.seniority + "@" +
            historicTicket.workOffice + "@" +
            historicTicket.cluster;
      historicTicket.key = key;
      listHistoricTickets.push(historicTicket);
    }
    return listHistoricTickets;
  };
  
  this._getTicketKey = function(ticket){
    var key = null;
    if (ticket){
      key = //ticket.name + "@" +
            ticket.client + "@" +
            //ticket.project + "@" +
            ticket.skill + "@" +
            ticket.seniority + "@" +
            ticket.location + "@" +
            ticket.cluster;
    }
    return key;
  };
  
  this._clientDescriptionHashFunction = function(element) {
    return toUpper(element["Client"] != undefined ? element["Client"] : element["client"]);
  }
  
  this._positionDescriptionHashFunction = function(element) {
    return toUpper( element["Client"] != undefined ? element["Client"] + "@" + element["Position"] : element["client"] + "@" + element["skill"]);
  }
  
  this._locationDescriptionHashFunction = function(element) {
    return toUpper( element["Location"] != undefined ? element["Location"]: element["Work Office"] );
  }
  
  this._ticketDescriptionHashFunction = function(element) { 
    var result;
    if (element instanceof Ticket){
      result = //element["name"] + "@" +
               element["client"] + "@" +
               //element["project"] + "@" +
               element["skill"] + "@" +
               element["seniority"] + "@" +
               element["location"] + "@" +
               element["cluster"];
    }
    else if(element instanceof HistoricTicket){
      result = element["key"];
    }
    else
    {
      result = //element["Name"] + "@" + 
               element["Client"] + "@" + 
               //element["Project"] + "@" +
               element["Position"] + "@" +
               element["Seniority"] + "@" +
               element["Work Office"] + "@" +
               element["Cluster"];
          
    }
    return result;
  }
  
  this._existsTicketInListHistoricTickets = function(ticket, listHistoricTickets){
    var i, historicTicket, result = null, wasFound = false;
    
    for (i in listHistoricTickets){
      historicTicket = listHistoricTickets[i];
      if (historicTicket.key === this._getTicketKey(ticket)){
        wasFound = true;
        break;
      }
    }
    if (wasFound){
      result = historicTicket;
    }
    else{
      result = null;
    }
    
    return result;
  };
  
  this._existsHistoricTicketInListTickets = function(historicTicket, listTickets){
    var i, ticket, result = null, wasFound = false;
    
    for (i in listTickets){
      ticket = listTickets[i];
      if (historicTicket.key === this._getTicketKey(ticket)){
        wasFound = true;
        break;
      }
    }
    
    if (wasFound){
      result = historicTicket;
    }
    else{
      result = null;
    }
    
    return result;
  }
  
  this._log = function(msg){
    if(this._logger)
      this._logger.log(msg);
    else{
      Logger.log(msg);
    }
  }
  
  var Ticket = function(){
    this.number = "";
    this.name = "";
    this.client = "";
    this.project = "";
    this.skill = "";
    this.seniority = "";
    this.location = ""; 
    this.openPosition = "";
    this.cluster = "";
    this.clientDescription = "";
    this.positionDescription = "";
    this.publish = "";
    //nuevos atributos
    this.programManagers = "";
    this.programManagersEmails = "";
    this.projectManagers = "";
    this.projectManagersEmails = "";
    this.technicalLeaders = "";
    this.technicalLeadersEmail = "";
    this.technicalDirector = "";
    this.technicalDirectorEmail = "";
  }
  
  var HistoricTicket = function(){
    this.key = "";
    this.number = "";
    this.name = "";
    this.client = "";
    this.project = "";
    this.position = "";
    this.seniority = "";
    this.workOffice = "";
    this.cluster = "";
    this.clientDescription = "";
    this.positionDescription = "";
    this.firstDateInAvailable = "";
    this.firstPublishDate = "";
    this.lastPublishDate = "";
  }
  
  var Glober = function() {
    this.rowID = "";
    this.user = "";
    this.createDate;
  }
  /***********************************************************************************************/
}

/*************************************************************************************************/
/* Normalise Library. Refactor and prepare to be moved as a Library                              */
/*                                                                                               */
/*************************************************************************************************/
var NormaliseLocationProcess = function() {
  this._LOCATIONS_REJECTED = new Array();
  this._LOCATIONS_MAPPING = null;
  this._COMPATIBLE_LOCATIONS_CACHE = {};
  this._NORMALISE_LOCATIONS_CACHE = {};
  
  this.compatibleLocations = function(locations1, locations2) {
    
    var hashKey = locations1+"|"+locations2;
    var mirrorHashKey = locations2+"|"+locations1;
    
    if( this._COMPATIBLE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var match = this._compatibleLocations(locations1, locations2);
      this._COMPATIBLE_LOCATIONS_CACHE[hashKey] = match;
      this._COMPATIBLE_LOCATIONS_CACHE[mirrorHashKey] = match;
    }

    return this._COMPATIBLE_LOCATIONS_CACHE[hashKey];
  }
  
  
  this.getLocationsRejected = function() {
    return this._LOCATIONS_REJECTED;
  }
  
  
  this.normaliseLocation = function(location) {
    
    var hashKey = location;
    
    if( this._NORMALISE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var normalised = this._normaliseLocation(location);
      this._NORMALISE_LOCATIONS_CACHE[hashKey] = normalised;
    }

    return this._NORMALISE_LOCATIONS_CACHE[hashKey];
  }
  
  this.locationIsAnywhere = function(location) {
    return this._prepareLocation(location) == "ANYWHERE";
  }
  

  /**********************************************************************************************************/
  this._compatibleLocations = function(locations1, locations2) {
    
    var normalisedLocation1Data = this._normaliseLocation(locations1);
    var normalisedLocation2Data = this._normaliseLocation(locations2);

    this._LOCATIONS_REJECTED = new Array();
    this._LOCATIONS_REJECTED.push.apply(normalisedLocation1Data.rejected, normalisedLocation2Data.rejected);
    
    var match = this._compatibleLocationArrays(normalisedLocation1Data.normalised, normalisedLocation2Data.normalised);
    return match;
  }

  
  this._prepareLocation = function(locationStr) {
    return locationStr.toLocaleUpperCase().trim();
  };

  
  this._setDefaultLocationsMapping = function() {
    this._LOCATIONS_MAPPING = getRows(getGlobersSuggestionsLocationsMappingSheet());
    
    for( var i = this._LOCATIONS_MAPPING.length-1; i >= 0; i-- ) {
      this._LOCATIONS_MAPPING[i]["Original"] = this._prepareLocation(this._LOCATIONS_MAPPING[i]["Original"]);
    }
  }


  this._compatibleLocationArrays = function(locationArray1, locationArray2)
  {
    if (!locationArray1) throw "Invalid Location: NULL";
    if (!locationArray2) throw "Invalid Location: NULL";
    
    for (i in locationArray1) {
      
      var location1 = locationArray1[i];
      for (j in locationArray2) {
        var location2 = locationArray2[j];
        
        if (!location1) throw "Invalid Location: NULL";
        if (!location2) throw "Invalid Location: NULL";
        
        if (location1 == "ANYWHERE") return true;
        if (location2 == "ANYWHERE") return true;
        if (location2 == location1) return true;
        
        if (location1.indexOf(location2) >= 0) return true;      
        if (location2.indexOf(location1) >= 0) return true;
      }
    }
    
    return false;
  }

  /**
   * Signature: NormalisedData normaliseLocation(String)
   */
  this._normaliseLocation = function(locationStr) {
    
    if( locationStr == null ) new this._NormalisedData([], []);
    
    var separator = ",";
    var locationsArray = null;
    var preparedLocationsArray = new Array();
    
    var mappedLocationsArray = new Array();
    var rejectedLocationsArray = new Array();
    
    /*
    * Change to uppercase and trim locations given first, to avoid calling this process repeated times
    */
    if( locationStr.indexOf(separator) > 0 ) {
      locationsArray = locationStr.split(separator);
    }
    else {
      locationsArray = [ locationStr ];
    }
    for( var i = 0; i < locationsArray.length; i++ ) {
      preparedLocationsArray.push(this._prepareLocation(locationsArray[i]));
    }
    
    
    /*
     * Find location in mapping
     */
    if( this._LOCATIONS_MAPPING == null ) {
      this._setDefaultLocationsMapping();
    }
    
    for( var i in preparedLocationsArray ) {
      var trimmedUCLocation = preparedLocationsArray[i];
      var match = false;
      
      for(var j=0; j < this._LOCATIONS_MAPPING.length; j++) {
        if( this._LOCATIONS_MAPPING[j]["Original"] == trimmedUCLocation ) {
          mappedLocationsArray.push(this._LOCATIONS_MAPPING[j]["Normalised"]);
          match = true;
          break;
        }
      }
      
      if( !match ) {
        rejectedLocationsArray.push(locationsArray[i]);
      }
    }
    
    return new this._NormalisedData(mappedLocationsArray, rejectedLocationsArray);
  }
  
  this._NormalisedData = function(normalised, rejected) {
    this.normalised = normalised;
    this.rejected = rejected;
  }

}

function getOpenPositionsTicketsSourceSheet() {
  return getBenchSpreadsheet().getSheetByName("Tickets");
}

function getOpenPositionsProjectsSourceSheet() {
  return getBenchSpreadsheet().getSheetByName("Projects");
}


function testOpenPositionProcess (){
  Logger.log('Starting...');
  var object = new OpenPositionProccess();
  object._sendGlobersToStaff();
  Logger.log('Finished');
}
