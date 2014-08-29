// Constructors and convenience methods for glober, Ticket and normalizeException objects


var Ticket = function(number, name, clientTAG, projectTAG, skill, seniority, location, englishLevel, benchStartDate) {
  this.number = number;
  this.name = name;
  this.client = clientTAG;
  this.project = projectTAG;
  this.skill = skill;
  this.seniority = seniority;
  this.location = location;
  this.englishLevel = englishLevel;
  this.benchStartDate = benchStartDate;
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
