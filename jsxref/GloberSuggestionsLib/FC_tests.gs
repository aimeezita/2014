function testPenaliseBenchDateMismatch() {
  
  var glober = new Glober();
  var ticket = new Ticket();
  var penalise = 0;
  
  ticket.benchStartDate = new Date();
  glober.benchStartDate = new Date();
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 0, "Failed #1");
  
  /*
  Si el ticket tiene fecha ‘start date’ vencida o igual a hoy (Stage 1), la penalización debe aplicarse respecto de hoy.
  i.      Ejemplo: ticket en stage 1, y un candidato que tiene bench start date=5 Febrero, penalización = 0%
  /**/
  ticket.benchStartDate = new Date();
  glober.benchStartDate = new Date("February 5, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 0, "Failed #2, got: " + penalise);

  /*
    ii.      Ejemplo: ticket en stage 1, y un candidato que tiene bencha start date=20 Febrero, penalización = 5% 
                        (7Feb + 7 dias sin penalización = 14 Feb. –> 20 Feb – 14 Feb = 6 dias * 0,5 por dia = 3%)
  /**/
  ticket.benchStartDate = new Date();
  glober.benchStartDate = new Date("February 20, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 3, "Failed #3, got: " + penalise);
    
  /*
  b. Si el ticket tiene fecha ‘start date’ futura, la penalización debe aplicarse respecto de la fecha de start date.
  i. Ejemplo: ticket en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench start date = 16 Febrero, penalización = 0%
  /**/
  ticket.benchStartDate = new Date("February 10, 2014 11:13:00");
  glober.benchStartDate = new Date("February 16, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 0, "Failed #4, got: " + penalise);

  /*
  ii. Ejemplo: ticket en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench start date = 20 Febrero, penalización = 1,5%
  /**/
  ticket.benchStartDate = new Date("February 10, 2014 11:13:00");
  glober.benchStartDate = new Date("February 20, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 1.5, "Failed #5, got: " + penalise);

  /*
  iii. Ejemplo: ticket en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench starte date = 1 Febrero, penalización = 1%
  (10Feb - 7 dias sin penalización = 3 Feb. –> 3 Feb – 1 Feb = 2 dias * 0,5 por dia = 1%)
  /**/
  ticket.benchStartDate = new Date("February 10, 2014 11:13:00");
  glober.benchStartDate = new Date("February 1, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 1, "Failed #6, got: " + penalise);
  
  /*
  iii. Ejemplo: ticket en stage 2 con ‘start date’ = 16 Marzo, y un candidato que tiene bench starte date = 20 Febrero, penalización = 0%
  (16Mar - 7 dias sin penalización = 9Mar. –> 9Mar – 20Feb = 17 dias * 0,5 por dia = 8.5%)
  /**/
  ticket.benchStartDate = new Date("March 16, 2014 11:13:00");
  glober.benchStartDate = new Date("February 20, 2014 11:13:00");
  penalise = penaliseBenchDateMismatch(ticket, glober);
  assert(penalise == 8.5, "Failed #7, got: " + penalise);
  
  log("All ok");

}


function testCache() {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var configSheet = spreadsheet.getSheetByName(Config_Sheet);
  var configData = getDataFromSheet(configSheet);
  
  var ITERS = 80000;
  var match, nomatch;

  log("Start Nocached");
  for( var i = ITERS; i > 0; i-- ) {
    match = getSkillDifference("Project Manager", "Project Manager", configData);
    nomatch = getSkillDifference("Project Manager", "Ruby Developer", configData);
    
    if( match != 0 || nomatch == 0 ) {
      log("Warning: " + match + " | " + nomatch);
      break;
    }
  }
  log("End");
  
  
  log("Start Cached");
  for( var i = ITERS; i > 0; i-- ) {
    match = getSkillDifferenceCached("Project Manager", "Project Manager", configData);
    nomatch = getSkillDifferenceCached("Project Manager", "Ruby Developer", configData);
    
    if( match != 0 || nomatch == 0 ) {
      log("Warning: " + match + " | " + nomatch);
      break;
    }
  }
  log("End");

}
