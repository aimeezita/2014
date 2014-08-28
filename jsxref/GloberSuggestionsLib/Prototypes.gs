// Constructors and convenience methods for glober, Ticket and normalizeException objects

var Glober = function(id, name, email, skill, seniority, location, englishLevel, benchStartDate ) {
  this.id = id;
  this.name = name;
  this.email = email;
  this.skill = skill; //string
  this.seniority = seniority; //int
  this.location = location; //string
  this.englishLevel = englishLevel; //int
  this.benchStartDate = benchStartDate; //date
}

var Ticket = function(name, number, client, project, skill, seniority, location, englishLevel, benchStartDate) {
  this.name = name;
  this.number = number;
  this.client = client;
  this.project = project;
  this.skill = skill; //string
  this.seniority = seniority; //int
  this.location = location; //string
  this.englishLevel = englishLevel; //int
  this.benchStartDate = benchStartDate; //date
}

var normalizeException = function (object_id, column, badValue) {
  this.object_id = object_id.toString();
  this.column = column;
  this.badValue = badValue;
}

// Convenience methods to log globers and tickets
Glober.prototype.toString: function() { 
  return 'name: ' + this.name 
  + ' email: ' + this.email 
  + ' skill: ' + this.skill 
  + ' seniority: ' + this.seniority
  + ' location: ' + this.location
  + ' english: ' + this.englishLevel 
  + ' bench: ' + this.benchStartDate ; 
}

Ticket.prototype.toString: function() {
  return '#: ' + this.number 
  + ' skill: ' + this.skill 
  + ' seniority: ' + this.seniority
  + ' location: ' + this.location
  + ' english: ' + this.englishLevel 
  + ' bench: ' + this.benchStartDate ; 
}

// Make an array out of a normalizeException instance
normalizeException.prototype.toArray: function() { 
  return [
    this.object_id,
    this.column,
    this.badValue
  ];
}
