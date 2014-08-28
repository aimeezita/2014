/******************************************************************************************************/
/**************************************** LOCATIONS ***************************************************/
/******************************************************************************************************/
function penalizeLocationsMismatchs(ticket, glober) {
  var penalise = getLocationsMismatchsCached(ticket, glober);
  return penalise;
}

var locationDifferenceCache = {};
function getLocationsMismatchsCached(ticket, glober){
  var key = ticket.number + "|" + glober.id + "|" + glober.name; 
  if( locationDifferenceCache[key] == undefined ) {
    var penalisedValue = getLocationsMismatchs(ticket, glober);
    locationDifferenceCache[key] = penalisedValue;
  }
  return locationDifferenceCache[key];
}

var CLIENT_LOCATIONS_MAPPING = getRows(getGlobersSuggestionsLocationsClientMappingSheet());

function locationValidForClient(client, location) {
  
  var locationIsValid = true;
  
  if(CLIENT_LOCATIONS_MAPPING != "")
    for( var i in CLIENT_LOCATIONS_MAPPING ) {
      var clientLocationMapping = CLIENT_LOCATIONS_MAPPING[i];
      if( clientLocationMapping["Client"] == client ) {
        
        /*
         * Client location validation must apply only when client is found and has a valid and specific location set
         */
        if( clientLocationMapping["Location"] != "" && !normaliseLocationProcess.locationIsAnywhere(clientLocationMapping["Location"]) ){
          
          locationIsValid = normaliseLocationProcess.compatibleLocations(clientLocationMapping["Location"], location);
        }
      }
    }

  return locationIsValid;
}

function getLocationsMismatchs(ticket, glober) {

  //Glober in location not compatible with client. Need to completelly ban de glober for this ticket, returning 100% mistmatch.
  if( !locationValidForClient(ticket.client, glober.location) ) {
    return 100;
  }
  
  var mismatchValue = 0;
  if( !normaliseLocationProcess.locationIsAnywhere(ticket.location) ){
    var match = normaliseLocationProcess.compatibleLocations(ticket.location, glober.location);
    if( !match ) {
      mismatchValue = 10;
      mismatchValue += penaliseDispersionMismatch(ticket, glober);
    }
  }
  else{
    mismatchValue = penaliseDispersionMismatch(ticket, glober);
  }  
  
  return mismatchValue;
}


/******************************************************************************************************/
/**************************************** SENIORITY ***************************************************/
/******************************************************************************************************/

function penaliseSeniorityMismatch(ticket, glober) {
  var penalise = getSeniorityMismatch(ticket.seniority, glober.seniority);
  return penalise;  
}

function getSeniorityMismatch(ticketSeniority, globerSeniority) {
  var mismatchValue = 0;
  
  if (ticketSeniority === (globerSeniority +1)){
    mismatchValue = 5;
  }
  else if (ticketSeniority === (globerSeniority +2)){
    mismatchValue = 15
  }
  else if (ticketSeniority === (globerSeniority +3)){
    mismatchValue = 25 
  }
  else if (ticketSeniority >= (globerSeniority +4)){
    mismatchValue = 30 
  }
  else if ((ticketSeniority +1) === globerSeniority){
    mismatchValue = 3 
  }
  else if ((ticketSeniority +2) === globerSeniority){
    mismatchValue = 5
  }
  else if ((ticketSeniority +3) === globerSeniority){
    mismatchValue = 20
  }
  else if ((ticketSeniority +4) <= globerSeniority){
    mismatchValue = 30
  }
  
  return mismatchValue;
}

/******************************************************************************************************/
/****************************************** SKILLS ****************************************************/
/******************************************************************************************************/

function penaliseSkillsMismatch(ticket, glober) {
  var skillDifference = getSkillsMismatch( ticket.skill, glober.skill);
  //var skillDifference = getSkillsMismatchCached( ticket.skill, glober.skill);
  return skillDifference;
}

function getSkillsMismatch(ticketSkill, globerSkill){
  var row,
      i=0,
      j=0,
      diference,
      configTicketSkill,
      configGloberSkill,
      compatibility = 0,
      result;
  
  //Skills iguales
  if (prepareKey(ticketSkill) === prepareKey(globerSkill))
    return 0;
  
  //Skills diferentes
  var key = ticketSkill + "|" + globerSkill;
  var result = MAPPINGS_DATASET.skillsCompatibilityMap[prepareKey(key)];
  if (result){
    compatibility = result;
  }
    
  if (compatibility > 0)
    diference = compatibility * 10;
  else
    diference = 100;
  return diference;
}

/*Deprecated
var skillDifferenceCache = {};
function getSkillsMismatchCached(ticketSkill, globerSkill){
  var key = ticketSkill + globerSkill; 
  if( skillDifferenceCache[key] == undefined ) {
    var penalisedValue = getSkillsMismatch(ticketSkill, globerSkill);
    skillDifferenceCache[key] = penalisedValue;
  }
  
  return skillDifferenceCache[key];
}*/

/******************************************************************************************************/
/**************************************** BENCH DATE **************************************************/
/******************************************************************************************************/

/**
 * Reglas (considerar "hoy" como 4 de Febrero del 2014):
 *
 * a.       Si el ticket tiene fecha ‘start date’ vencida o igual a hoy (Stage 1), la penalización debe aplicarse respecto de hoy.
 * 
 *   i.      Ejemplo: ticket en stage 1, y un candidato que tiene bench start date=5 Febrero, penalización = 0%
 *   ii.      Ejemplo: ticket en stage 1, y un candidato que tiene bencha start date=20 Febrero, penalización = 5% (3Feb + 7 dias sin penalización = 10 Feb. –> 20 Feb – 10 Feb = 10 dias * 0,5 por dia = 5%)
 * 
 * b.      Si el ticket tiene fecha ‘start date’ futura, la penalización debe aplicarse respecto de la fecha de start date.
 * 
 *   i.      Ejemplo: ticket en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench start date = 16 Febrero, penalización = 0%
 *   ii.      Ejemplo: ticket en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench start date = 20 Febrero, penalización = 1,5%
 *   iii.      Ejemplo: ticketn en stage 2 con ‘start date’ = 10 Febrero, y un candidato que tiene bench starte date = pasado, penalización = 0%
 *   
/**/
function penaliseBenchDateMismatch(ticket, glober) {
  
  var penalise = getBenchDateMismatch(ticket.benchStartDate, glober.benchStartDate);
  return penalise;
}


function getBenchDateMismatch(ticketStartDate, globerBenchStartDate) {
  var diasTolerancia = 7,
      segundosPorDia = 86400000,
      totalPenalizacion = 0,
      diference,
      diasPenalizacion,
      today = new Date();

  /**
   * Check if glober is currently on bench, therefore there's no penalty as glober is already available
   */
  if( globerBenchStartDate < today && ticketStartDate < today )
    return 0;
    
  if( ticketStartDate < today ) {
    ticketStartDate = today;
  }
  
  diference = Math.ceil(Math.abs(ticketStartDate - globerBenchStartDate) / segundosPorDia);
  
  if (diference > diasTolerancia){
    diasPenalizacion = diference - diasTolerancia;
    totalPenalizacion = diasPenalizacion * 0.5;
  }
  
  return totalPenalizacion;
}

/******************************************************************************************************/
/**************************************** GEO DISPERSION **********************************************/
/******************************************************************************************************/


function penaliseDispersionMismatch(ticket, glober) {
  var normalisedData = normaliseLocationProcess.normaliseLocation(glober.location);
  var penalise = getDispersionMismatch(ticket.client, ticket.project, normalisedData.normalised);
  return penalise;
}

function getDispersionMismatch(client, project, globerLocation) {
  var key, mismatchValue = 0;
  client = clean(client);
  project = clean(project);
  globerLocation = clean(globerLocation);
  
  key = client;
  if (HASSED_RELEASES [key]){
    key = client + "|" +  project;
    if (HASSED_RELEASES[key]){
      key = client + "|" +  project +"|" + globerLocation; 
      if (!HASSED_RELEASES [key]){
        mismatchValue = 5;  
      }
    }
    key = client + "|" + globerLocation;
    if (!HASSED_RELEASES [key]){
      mismatchValue = mismatchValue + 5;
    }
  }
    
  return mismatchValue;
}
