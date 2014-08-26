/***************************************************/
var MAPPINGS_DATASET = new MappingsDataset();
MAPPINGS_DATASET.init();
/***************************************************/

function StaffingSuggestions_cron() {
  log("Starting Process");
  
  var parameters = getParameters(getGlobersSuggestionsParametersSheet());
  var availableData = getRows(getPublicBenchSheet());
  var globersData = getRows(getPublicGlobersSheet());
  var ticketsData = getRows(getPublicTicketSheet());
  var matchingsToIgnoreData = getRows(getPublicMatchingToIgnoreSheet());
  var assignmentLogData = getRows(getAssignmentLogSheet());
  log("End reading data");
      
  var 
    listTickets = [],
    listBadTickets = [],
    listGlobers = [],
    listBadGlobers = [],
    listMatchingsIgnored = new Array(),
    listSuggestions =[],
    listHashedIgnoredSuggestions = {}
  ;
  
  try{ // catch is commented out
    listTickets = getListTickets(ticketsData);
    listGlobers = getListGlobers(availableData); 
    
    log("****************NormalizeTickets");
    log("listTickets: " + listTickets.length + " | listBadTickets: " + listBadTickets.length);
    listTickets = normalizeTickets(listTickets, listBadTickets);
    log("listTickets: " + listTickets.length + " | listBadTickets: " + listBadTickets.length);
    
    log("****************NormalizeGlobers");
    log("listGlobers: " + listGlobers.length + " | listBadGlobers: " + listBadGlobers.length + " | globersData: " + globersData.length);
    listGlobers = normalizeGlobers(listGlobers, listBadGlobers,  globersData);
    log("listGlobers: " + listGlobers.length + " | listBadGlobers: " + listBadGlobers.length + " | globersData: " + globersData.length);
    
    log("****************Print BadValues");
    log("listBadTickets: " + listBadTickets.length + " | listBadGlobers: " + listBadGlobers.length);
    printBadValues(getGlobersSuggestionsBadValuesSheet(), listBadTickets, listBadGlobers); 
    
    /*
     * Ignore matches for those previously marked as to ignore pair of ticket-glober, 
     * and for those globers which have been already suggested to a given project.
     */
    log("****************Prepare list of Matches to Ignore");
    listHashedIgnoredSuggestions = setHashedIgnoredSuggestions(listHashedIgnoredSuggestions, matchingsToIgnoreData);
    log("listHashedIgnoredSuggestions: " + Object.keys(listHashedIgnoredSuggestions).length);
    listHashedIgnoredSuggestions = setHashedIgnoredSuggestions(listHashedIgnoredSuggestions, assignmentLogData);
    log("listHashedIgnoredSuggestions: " + Object.keys(listHashedIgnoredSuggestions).length);
    
    
    log("****************Compute Suggestions");
    log("listSuggestions: " + listSuggestions.length + " | listTickets: " + listTickets.length  
        + " | listGlobers: " + listGlobers.length + " | minimumMatch: " + parameters.minimumMatch);
    computeSuggestions(listSuggestions, listHashedIgnoredSuggestions, listMatchingsIgnored, listTickets, listGlobers, parameters.minimumMatch);
    log("listSuggestions: " + listSuggestions.length + " | listTickets: " + listTickets.length  
        + " | listGlobers: " + listGlobers.length + " | minimumMatch: " + parameters.minimumMatch);
    
    log("****************Print Suggestions");
    log("listSuggestions: " + listSuggestions.length +" | printDetails: " + parameters.printDetails);
    printSuggestions(getGlobersSuggestionsSuggestionsSheet(), getGlobersSuggestionsSuggestionsDetailsSheet(), listSuggestions, parameters.minimumMatch, parameters.printDetails);
    log("listSuggestions: " + listSuggestions.length +" | printDetails: " + parameters.printDetails);

    log("****************Print MatchingsIgnored");
    log("listMatchingsIgnored: " + listMatchingsIgnored.length);
    printMatchingsIgnored(getGlobersSuggestionsMatchingsIgnoredSheet(), listMatchingsIgnored);
    
    log("****************Print BestSuggestions");
    log("listSuggestions: " + listSuggestions.length);
    printBestSuggestions(listSuggestions, parameters);
    /**/

    log("ENDED OK");
  }
  /*
  catch(e)
  {
    log("****************Not controlled exception");
    log(e);
    log("ENDED NOTOK");
    throw (e);
  }
  */
  finally{
    saveLog(getGlobersSuggestionsLogsSheet());
  }
}

function setHashedIgnoredSuggestions(hashedIgnoredSuggestions, ignoreDataRows){
  for (var i in ignoreDataRows) {
    var source = ignoreDataRows[i];
    
    
    var hashKey = stripHashTag(source["Ticket"]) + source["Glober Email"] + source["Glober Name"];
    hashedIgnoredSuggestions[hashKey] = true;

    
    if( source["Client"] != undefined && source["Client"] != "#N/A" ) {
      var hashKey = source["Client"] + source["Glober Email"] + source["Glober Name"] + source["Project"];
      hashedIgnoredSuggestions[hashKey] = true;
    }
  }
  
  return hashedIgnoredSuggestions;
}


function getListTickets(ticketsData){
  
  var item, name, number, skill, location, seniority, english, client, project, bench, ticket,
    listTickets = []
  ;

  for (var i in ticketsData) {
    if (!ticketsData[i]) { break }; 
    item = ticketsData[i]; // local reference
    name = item["Name"];
    number = item["Number"];
    client = item["Client"];
    project = item["Project"];
    skill = item["Position"];
    seniority = item["Seniority"];
    location = item["Work Office"];
    english = null;                           // english not available?
    bench = item["Start Date"];
    ticket = new Ticket(name, number, client, project, skill, seniority, location, english, bench);
    listTickets.push(ticket);    
  }
  return listTickets;
}

function getListGlobers(availableData){
  var item, id, name, email, skill, location, seniority, english, bench, plan, glober, operationSkill, operationSeniority,
      listGlobers = [];
  
  for (var i in availableData) {
    
    if (!availableData[i])
      break;
    
    item = availableData[i];
    name = item["Name"];
    email = item["Email"];
    skill = item["Skill"];
    location = item["Location"];
    seniority = item["Seniority"];
    bench = item["Bench Start Date"];
    plan = item["Plan"].toLocaleUpperCase().trim();
    
    /**
     * Avoid globers having plan like "exit" or "confirmed" or "assigned"
     */
    if( "EXIT" != plan && "CONFIRMED" != plan && "ASSIGNED" != plan ) {
      glober = new Glober(id, name, email, skill, seniority, location, english, bench);
      listGlobers.push(glober);
    }
  }
  
  return listGlobers;
}

function normalizeTickets(listTickets, listBadTickets) {
  var ticket;
  var validTickets = [];
  var validTicketsNdx = 0;
  var result = undefined;
  
  for (var i in listTickets) {
    var isValidTicket = true;
    
    try{
      ticket = listTickets[i];
      ticket.number = parseInt(ticket.number.toString().replace("#",""));
      
      //ticket.location = getNormalTicketLocation(ticket, configData);
      var normalisedData = normaliseLocationProcess.normaliseLocation(ticket.location);
      if( normalisedData.rejected != undefined && normalisedData.rejected.length > 0 ) {
        isValidTicket = false;
        var rejecteds = normalisedData.rejected;
        for( var i = 0; i < rejecteds.length; i++ ) {
          listBadTickets.push([ticket.number, "Location", rejecteds[i] ]);
        }
      }
      
      if( !locationValidForClient(ticket.client, ticket.location) ) {
        isValidTicket = false;
        if( normaliseLocationProcess.getLocationsRejected().length > 0 ) {
          var rejecteds = normaliseLocationProcess.getLocationsRejected();
          for( var i = 0; i < rejecteds.length; i++ ) {
            listBadTickets.push([ticket.number, "Location inconsistency, client: " + ticket.client, rejecteds[i] ]);
          }
        }
      }
      
      result = MAPPINGS_DATASET.skillsMap[prepareKey(ticket.skill)];
      if (!result){
        isValidTicket = false;
        listBadTickets.push([ticket.number, "Skill: " , ticket.skill]);
      }
      
      
      //ticket.skill = getNormalValueFromSheet(ticket.number, "Skill", ticket.skill, configData, Cols_Config.skill, Cols_Config.skill);
      
      result = MAPPINGS_DATASET.senioritiesMap[prepareKey(ticket.seniority)];
      if (!result){
        isValidTicket = false;
        listBadTickets.push([ticket.number, "Seniority: " , ticket.seniority]);
      }
      else{
        ticket.seniority = result
      }
      
      /*
      ticket.seniority = parseInt(getNormalValueFromSheet(ticket.number, "Seniority",ticket.seniority, configData,  Cols_Config.seniority, Cols_Config.seniority_level));
      if (isNaN(ticket.seniority))
        throw new normalizeException(ticket.seniority,"Number",ticket.seniority);
      */
      if( isValidTicket ) {
        validTickets[validTicketsNdx] = ticket;
        validTicketsNdx = validTicketsNdx + 1;
      }
    }
    catch(e)
    {
      if(e instanceof normalizeException)
      {
        listBadTickets.push(e.toArray());
      }
      else
      {
        throw e;
      }
      
    }
  }
  
  return validTickets;
}

function normalizeGlobers(listGlobers, listBadGlobers, globersData) {
  var glober,
      operationSkill,
      operationSeniority,
      result = null;
  
  operationSkill = "Project Manager";
  operationSeniority = "SSr";
  var validGlobers = [];
  var validGlobersNdx = 0;
  
  for (var i in listGlobers) {
    var isValidGlober = true;
    
    try{
      glober = listGlobers[i];
      glober.id = getGloberIdByEmail(globersData, glober.email);
      
      var normalisedData = normaliseLocationProcess.normaliseLocation(glober.location);
      if( normalisedData.rejected != undefined && normalisedData.rejected.length > 0 ) {
        isValidGlober = false;
        var rejecteds = normalisedData.rejected;
        for( var i = 0; i < rejecteds.length; i++ ) {
          listBadGlobers.push([glober.name, "Location", rejecteds[i] ]);
        }
      }
      
      result = MAPPINGS_DATASET.skillsMap[prepareKey(glober.skill)];
      if (!result){
        isValidGlober = false;
        listBadGlobers.push([glober.name,"Skill",glober.skill]);
      }
      else{
        if (result == "OPERATION")
          glober.skill = operationSkill;
      }
      
      if (glober.skill === operationSkill){
        glober.seniority = operationSeniority;
      }
      
      result = MAPPINGS_DATASET.senioritiesMap[prepareKey(glober.seniority)];
      if (!result){
        isValidGlober = false;
        listBadGlobers.push([glober.name,"Seniority",glober.seniority]);
      }
      else{
        glober.seniority = parseInt(result);
      }
      
      if (isValidGlober){
        validGlobers[validGlobersNdx] = glober;
        validGlobersNdx = validGlobersNdx + 1;
      }
    }
    catch(e){
      if(e instanceof normalizeException){
        listBadGlobers.push(e.toArray());
      }
      else{
        throw e;
      }
    }   
  }
  
  return validGlobers; 
  
}

function getGloberIdByEmail (globersData, globerEmail){
  
  /**
  DARIO: Que pasa si el email es NH???
  Por favor revisar
  
  Si el mail es NH entonces el ID es undefined (para todos igual)
  **/
  
  var i,
      id,
      email,
      row;
  
  for (i in globersData){
    row =  globersData[i];
    email = row["Email"];
    if (email === globerEmail){
      id = row["Glober ID"];
      break;
    }
  }
  
  return id;
}


function printBadValues(dataSheet, listBadTickets, listBadGlobers){
  
  clearSheet(dataSheet);
  if (listBadTickets && listBadTickets.length > 0)
    dataSheet.getRange(2, 1, listBadTickets.length, listBadTickets[0].length).setValues(listBadTickets);
  if (listBadGlobers && listBadGlobers.length > 0)
    dataSheet.getRange(2, 5, listBadGlobers.length, listBadGlobers[0].length).setValues(listBadGlobers);  
}

function printMatchingsIgnored(dataSheet, listMatchingsIgnored){
  var i,
      row,
      ticket,
      glober,
      arrayOfValues = [];
  
  clearSheet(dataSheet);
  if (listMatchingsIgnored && listMatchingsIgnored.length > 0){
    for (i in listMatchingsIgnored){
      row = listMatchingsIgnored[i];
      ticket = row[0];
      glober = row[1];
      arrayOfValues.push([ticket.number, glober.email]);
    }
    if (arrayOfValues)
      dataSheet.getRange(2, 1, arrayOfValues.length, arrayOfValues[0].length).setValues(arrayOfValues);
  }    
}

function printSuggestions(suggestionsSheet, suggestionsDetailsSheet, listSuggestions, minimunMatch, printDetails){
  var i,
      arrayOfValues = [],
      arrayOfDetailValues = [],
      row,
      ticket,
      glober,
      matchValues,
      breakdownText;
  
  clearSheet(suggestionsSheet);
  clearSheet(suggestionsDetailsSheet);
  
  if (listSuggestions && listSuggestions.length > 0){
    
    for (i in listSuggestions){
      row = listSuggestions[i];
      ticket = row[0];
      glober = row[1];
      matchValues = row[2];
      
      breakdownText = prepareMatchingBreakdown(matchValues);
      
      if (matchValues.matchValue >= minimunMatch){
        arrayOfValues.push([ticket.number, ticket.name, ticket.client, ticket.project, glober.id, glober.email, glober.name, glober.location, matchValues.matchValue, breakdownText]);
      }

      if (printDetails) {
        if (matchValues.matchValue >= minimunMatch){
          arrayOfDetailValues.push([ticket.number, glober.email, glober.name, glober.location, -matchValues.locationMismatch, -matchValues.skillMismatch, -matchValues.seniorityMismatch, -matchValues.benchDateMismatch, matchValues.matchValue])
        }
      }
    }
    
    if( arrayOfValues.length > 0 ) 
      suggestionsSheet.getRange(2,1,arrayOfValues.length, arrayOfValues[0].length).setValues(arrayOfValues);    
    
    
    if( arrayOfDetailValues.length > 0 )
      suggestionsDetailsSheet.getRange(2,1,arrayOfDetailValues.length, arrayOfDetailValues[0].length).setValues(arrayOfDetailValues);
  }    
}


function computeSuggestions(listSuggestions, listHashedIgnoredSuggestions, listMatchingsIgnored, tickets, globers, minimumMatch) {
  var matchingList = 0,
      i=0,
      j=0,
      ticket,
      glober,
      countMatches = 0;

  for(i in tickets){
    for (j in globers){
      ticket = tickets[i];
      glober = globers[j];
      countMatches = countMatches + 1;
      var matchValues = {};
      try {
        var hashKeyClientProject = ticket.client + glober.email + glober.name + ticket.project;
        var hashKeyTicket = stripHashTag(ticket.number) + glober.email + glober.name;
        if ( listHashedIgnoredSuggestions[hashKeyClientProject] == undefined
            && listHashedIgnoredSuggestions[hashKeyTicket] == undefined )
        {
          computeMatch(ticket, glober, matchValues, minimumMatch);
          listSuggestions.push([ticket, glober, matchValues]);
        }
        else {
          listMatchingsIgnored.push([ ticket, glober ]);
        }
      }
      catch(e) {
            //******DARIO: MAL MANEJADO EL EXCEPTION, corregir por favor ****
        log("Exception at: {" + ticket + "}, {" + glober + "}: " + e);
      }
    }
  }
  
  log("Total matches computed: " + countMatches);
}

function prepareMatchingBreakdown(matchValues) {
  var breakdownStr = "";
  
  if (matchValues.locationMismatch > 0)
    breakdownStr = breakdownStr + ", Location: " + matchValues.locationMismatch;
  if (matchValues.seniorityMismatch > 0)
    breakdownStr = breakdownStr + ", Seniority: " + matchValues.seniorityMismatch;
  if (matchValues.skillMismatch > 0)
    breakdownStr = breakdownStr + ", Skill: " + matchValues.skillMismatch;
  if (matchValues.benchDateMismatch > 0)
    breakdownStr = breakdownStr + ", BenchDate: " + matchValues.benchDateMismatch;
  
  if (breakdownStr != "")
    breakdownStr = breakdownStr.substring(2)
 
  return breakdownStr;
}

function computeMatch(ticket, glober, matchValues, minimumMatch){
  var matchValue=100;
  
  matchValues.locationMismatch = 0,
  matchValues.seniorityMismatch = 0,
  matchValues.skillMismatch = 0,
  matchValues.benchDateMismatch = 0;
  
  //****************skill
  matchValues.skillMismatch = penaliseSkillsMismatch(ticket, glober);
  matchValue -= matchValues.skillMismatch;
  
  if (matchValue >= minimumMatch)
  {
    //*****************Location
    matchValues.locationMismatch = penalizeLocationsMismatchs(ticket, glober);
    matchValue -= matchValues.locationMismatch;

    if (matchValue >= minimumMatch)
    {
      //****************bench
      matchValues.benchDateMismatch = penaliseBenchDateMismatch(ticket, glober);
      matchValue -= matchValues.benchDateMismatch;
      
      if (matchValue >= minimumMatch)
      {
        //****************seniority
        matchValues.seniorityMismatch = penaliseSeniorityMismatch(ticket, glober);
        matchValue -= matchValues.seniorityMismatch;
        
      }
    }
  }
  
  matchValues.matchValue = matchValue;
  return matchValue;
}


function getNormalSkillFromGlober(object_id, column_name, value, configData, operationSkill){
  var operationType,
      skillType,
      newSkill,
      skillSearch;
  
  operationType = "OPERATION";
  skillType =  getNormalValueFromSheet(object_id, "Skill", value, configData, Cols_Config.skill, Cols_Config.skill_type);
  
  if (skillType === operationType)
    skillSearch = operationSkill;
  else
    skillSearch = value;
  
  newSkill = getNormalValueFromSheet(object_id, "Skill", skillSearch, configData, Cols_Config.skill, Cols_Config.skill);
  
  return newSkill;
}

function getNormalValueFromSheet (object_id, column_name, value, configData, col_value, col_equivalent_value){
  var i=0,
      item,
      normalValue = 0;
  
  for (i in configData){
    item = configData[i];
    if(!item[col_value] && !item[col_equivalent_value])
      break;
    if ( item[col_value] != undefined && value != undefined && item[col_equivalent_value] != undefined
        && (item[col_value].toString().toLocaleUpperCase().trim() === value.toString().toLocaleUpperCase().trim())){
      normalValue = item[col_equivalent_value].toString().toLocaleUpperCase().trim();
      break;
    }
  }
  
  if (normalValue === 0 || !value || value==="" || value === null){
    throw new normalizeException(object_id, column_name, value);
  }
  return normalValue;
}


function getParameters(sheet) {
  var data = sheet.getDataRange().getValues();
  var params = {};
  var val = "";
  for (var i in data) {
    val = data[i][1];
    switch(data[i][0]) {
      case "Minimum Match":
        params.minimumMatch = val;
        break;
      case "Print Details":
        params.printDetails = val;
        break;
      case "Number of suggestions":
        params.numSuggestions = val;
        break;
      case "Bench minimun match":
        params.benchMinimumMatch = val;
        break;
    }
  }
  
  return params;
}
