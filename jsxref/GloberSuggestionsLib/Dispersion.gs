var HASSED_RELEASES = getHashedReleases();

function testReleases(){
  var ticket = new Ticket();
  var glober = new Glober();
  ticket.client = "Disney";
  ticket.project = "Anglerfish";
  glober.location = "BA";
  var result = penaliseDispersionMismatch(ticket, glober);
  log(result);
  //log(HASSED_RELEASES);
}

function getHashedReleases(){
var today = new Date(),
  hasshedReleases = {},
  hashKey,
  source,
  globerPosition,
  i,
  normalisedData,
  client,
  project,
  globerLocation;

  var releasesData = getRows(getGlowImports2ReleasesSheet());
  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");

  for (var i in releasesData) {
  
    source = releasesData[i];
    globerPosition = clean(source["Glober Position"]);
    client = clean(source["Client Name"]);
    project = clean(source["Project Name"]);
    globerLocation = globerMap[source["Glober ID"]]["Glober Office"];
      "NOTFOUND" //clean(source["Glober Office"]); /* DROBAK: OJO NO ESTA MAS!!! Sacarla de la tabla de globers*/
    
    
    if (source["Percentage"] <=0 || source["Starting Date"] > today 
        || source["End Date"] < today || globerPosition === "PROGRAM MANAGER" 
        || globerPosition ==="GURU"){
        
    } else {
    
      if (client){
        hashKey = client;
        hasshedReleases[hashKey] = true;
      }
      if (client && project){
        hashKey = client + "|"+ project ;
        hasshedReleases[hashKey] = true;
      }
      normalisedData = normaliseLocationProcess.normaliseLocation(globerLocation);
      
      if (normalisedData.normalised && normalisedData.normalised.length > 0 && client && project){
        hashKey = client + "|"+ project + "|" + normalisedData.normalised;
        hasshedReleases[hashKey] = true;
      }
      
      if (normalisedData.normalised && normalisedData.normalised.length > 0 && client){
        hashKey = client + "|"+ normalisedData.normalised;
        hasshedReleases[hashKey] = true;
      }
    }
  }
  
  return hasshedReleases;
  
}

