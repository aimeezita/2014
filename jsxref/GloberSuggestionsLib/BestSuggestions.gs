function testBestSuggestions(){
  var ticket = new Ticket("ticket", 1, "ticket client", "ticket project", "ticket skill", "ticket seniority", "ticket location", "ticket english", "ticket date");
  var glober = new Glober("glober id", "glober name", "glober email", "glober skill", "glober seniority", "glober location", "glober encglish level", "glober date" )
  var object = {}
  object.matchValue = 90;
  var item = [ticket, glober, object];
  printBestSuggestions( [item], getParameters(getGlobersSuggestionsParametersSheet()) );
}
/************************************************************/
function printBestSuggestions(listSuggestions, parameters){
  var globers = getBestTicketsPerGlober(listSuggestions, parameters);
  log("- Grouping globers");
  var sortedGlobers = orderSuggestions(globers, parameters.numSuggestions);
  log("- Print grouped globers in globerssuggestions");
  printBestGlobersResult(sortedGlobers);
  
  var tickets = getBestGlobersPerTicket(listSuggestions, parameters);
  log("- Grouping tickets")
  var sortedTickets = orderSuggestions(tickets, parameters.numSuggestions);
  log("- print tickets in ticketsSuggestions")
  printBestTicketsResult(sortedTickets);
  /***Copy values to bench sheet*****/
  log("- Print tickets in Bench")
  printBestTicketsResultOnBenchSheet(sortedTickets);
  log("- Print globers in Bench")
  printBestGlobersResultOnBenchSheet(sortedGlobers);
}

function printBestTicketsResultOnBenchSheet(tickets){
  //open bench sheet, currently for test purposes is 0AnL19RkEQxp_dFloUjRsSmtpUklKQ1E0cGF6NnJRQ2c
  var dataRange;
  var ticketSheet=getPublicTicketSheet();
  var benchRows=getRows(ticketSheet);
  var newDataArray=[];
  for(var i=0;i<benchRows.length;i++){
    if(tickets[benchRows[i].Number.substring(1)])
      benchRows[i]["Staffing Suggestions"]=tickets[benchRows[i].Number.substring(1)];
    else
      benchRows[i]["Staffing Suggestions"]="";
    //newDataArray.push([benchRows[i]["Number"],benchRows[i]["Name"],benchRows[i]["Handler"],benchRows[i]["Submit Date"],benchRows[i]["Update Date"],benchRows[i]["Studio"],benchRows[i]["Glow Submitter"],benchRows[i]["Client"],benchRows[i]["Project"],benchRows[i]["Position"],benchRows[i]["Seniority"],benchRows[i]["Type of Assignment"],benchRows[i]["Load"],benchRows[i]["Start Date"],benchRows[i]["Work Office"],benchRows[i]["Estimated Travel Period"],benchRows[i]["Replacement"],benchRows[i]["Client Interview Require?"],benchRows[i]["Handler Team"],benchRows[i]["Stage"],benchRows[i]["Aging"],benchRows[i]["Priority"],benchRows[i]["OpenPosition"],benchRows[i]["Cluster"],benchRows[i]["SyncData"],benchRows[i]["Staffing Suggestions"],benchRows[i]["TL"],benchRows[i]["TD"],benchRows[i]["Bucket (Weeks)"],benchRows[i]["Days to comply SLA"]]);
    newDataArray.push([benchRows[i]["Staffing Suggestions"]]);
  }
  //Print data on bench sheet
  var newColumnNdx = getHeaderIndexes(ticketSheet)["Staffing Suggestions"];
  // Clear current data
  ticketSheet.getRange(2, newColumnNdx, ticketSheet.getMaxRows() - 1, 1).clear();
  // update whole column
  dataRange=ticketSheet.getRange(2,newColumnNdx,newDataArray.length,1);
  dataRange.setValues(newDataArray);
  // Adjust column width automatically
  //ticketSheet.autoResizeColumn(newColumnNdx);
}

function printBestGlobersResultOnBenchSheet(objectSuggestions){
  //open bench sheet, currently for test purposes is 0AnL19RkEQxp_dFloUjRsSmtpUklKQ1E0cGF6NnJRQ2c
  var availableSheet=getPublicBenchSheet();
  var benchRows=getRows(availableSheet);
  var newDataArray=[];
  var dataRange;
  
  for(var i=0;i<benchRows.length;i++){
    if(objectSuggestions[benchRows[i].Email+"|"+benchRows[i].Name])
      benchRows[i]["Staffing Suggestions"]=objectSuggestions[benchRows[i].Email+"|"+benchRows[i].Name];
    else
      benchRows[i]["Staffing Suggestions"]="";
    //newDataArray.push([benchRows[i]["Name"],benchRows[i]["Email"],benchRows[i]["%"],benchRows[i]["Location"],benchRows[i]["Skill"],benchRows[i]["Seniority"],benchRows[i]["Studio"],benchRows[i]["English"],benchRows[i]["Bench Start Date"],benchRows[i]["Aging"],benchRows[i]["Source"],benchRows[i]["Assignment"],benchRows[i]["Handler Team"],benchRows[i]["Plan"],benchRows[i]["Start Date"],benchRows[i]["Assignment Plan Ticket #"],benchRows[i]["Copia Nombre"],benchRows[i]["Assignment Plan Description"],benchRows[i]["Assignment Plan Client"],benchRows[i]["Stage"],benchRows[i]["StagePerWeek"],benchRows[i]["SeniorityRange"],benchRows[i]["Weak"],benchRows[i]["Weak: Description"],benchRows[i]["Weak: MailSent"],benchRows[i]["Weak: Start date"],benchRows[i]["TicketEntrevista"],benchRows[i]["Fecha CV actualizado"],benchRows[i]["PlanAgainsTargetDate"],benchRows[i]["Vacaciones"],benchRows[i]["Staffing Suggestions"]]);
    newDataArray.push([benchRows[i]["Staffing Suggestions"]]);
  }
  //Print data on bench sheet
  var newColumnNdx = getHeaderIndexes(availableSheet)["Staffing Suggestions"];
  // Clear current data
  availableSheet.getRange(2, newColumnNdx, availableSheet.getMaxRows() - 1, 1).clear();
  // update whole column
  dataRange=availableSheet.getRange(2,newColumnNdx,newDataArray.length,1);
  dataRange.setValues(newDataArray);
  // Adjust column width automatically
  //availableSheet.autoResizeColumn(newColumnNdx);
}

function printBestTicketsResult(objectSuggestions){
  var sheet = getGlobersSuggestionsTicketsSuggestionsSheet();
  clearSheet(sheet);
  
  var key, arrayResult= [];
  for (key in objectSuggestions){
    arrayResult.push([key, objectSuggestions[key]]);
  }

  if (arrayResult.length > 0) {
    sheet.getRange(2,1,arrayResult.length, arrayResult[0].length).setValues(arrayResult);
  }
  //sheet.autoResizeColumn(2);
}

function printBestGlobersResult(objectSuggestions){
  var sheet = getGlobersSuggestionsGlobersSuggestionsSheet();
  
  clearSheet(sheet);
  
  var key, arrayResult= [];
  
  for (key in objectSuggestions){
    var array = key.split("|");
    arrayResult.push([array[0],array[1],objectSuggestions[key]]);
  }

  if (arrayResult.length > 0)
    sheet.getRange(2,1,arrayResult.length, arrayResult[0].length).setValues(arrayResult);
  //sheet.autoResizeColumn(3);
}

function getBestTicketsPerGlober(listSuggestions, parameters){
  var objectMap = {};
  var i, key, row, ticket, glober,matchValues;
 
  for (i in listSuggestions){
    row = listSuggestions[i];
    ticket = row[0];
    glober = row[1];
    matchValues = row[2];
    
    if ( matchValues.matchValue >=  parameters.benchMinimumMatch){
      var breakdown =  prepareMatchingBreakdown(matchValues);
      if (breakdown != "") breakdown = " (" + breakdown+ ")";
      key = glober.email +"|"+ glober.name;
      
      if (!objectMap[key]) objectMap[key] = [];
      var description = ticket.number + " " + ticket.project + " (" + ticket.client + ") match " + matchValues.matchValue + "%" + breakdown;
      objectMap[key].push([matchValues.matchValue, description]);
    }
  }
  return objectMap;
}


function getBestGlobersPerTicket(listSuggestions, parameters){
  var objectMap = {};
  var i, key, row, ticket, glober,matchValues;
  
  for (i in listSuggestions){
    row = listSuggestions[i];
    ticket = row[0];
    glober = row[1];
    matchValues = row[2];
    
    if ( matchValues.matchValue >=  parameters.benchMinimumMatch){
      var username = glober.email;
      if( glober.email.indexOf("@") > 0 )
        username = glober.email.split("@")[0];
      var breakdown =  prepareMatchingBreakdown(matchValues);
      if (breakdown != "") breakdown = " (" + breakdown+ ")";
      key = ticket.number;
      if (!objectMap[key]) objectMap[key] = [];
      var description =  glober.id + " " + glober.name + " (" + username + ") at " + glober.location + " match " + matchValues.matchValue + "%" + breakdown;
      objectMap[key].push([matchValues.matchValue, description]);
    }
  }
  return objectMap;
}

function orderSuggestions(suggestions, maxOfItems){
  var key, newObject = {};
  for (key in suggestions){
    newObject[key] = getStringDescriptionByArray(suggestions[key], maxOfItems);
  }
  return newObject;
}
  
function getStringDescriptionByArray(arrayItem, maxOfItems){
  var i, str = "";
  arrayItem.sort(Comparator);
  var count = 1;
  for (i in arrayItem){
    str = str + arrayItem[i][1] + "\n";
    if (count == maxOfItems) break;
    count ++;
  }
  return str;
}

function Comparator(a,b){
  if (a[0] < b[0]) return 1;
  if (a[0] > b[0]) return -1;
  return 0;
}
