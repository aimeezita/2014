// Glober class: models a glober by containing his/her data and providing
// a set of obvious methods

var Glober = function(id, name, email, skill, seniority, location, englishLevel, benchStartDate ) {
  this.id = id;
  this.name = name;
  this.email = email;
  this.skill = skill; //string
  this.seniority = seniority; //int
  this.location = location; //string
  this.englishLevel = englishLevel; //int
  this.benchStartDate = benchStartDate; //date
  return this;                    // $$$$ chaining?
}

  Glober.prototype = {

    // returns a string useful to log a Glober's data
    toString: function() { 
      return 'name: ' + this.name 
      + ' ' + this.email 
      + ' skill: ' + this.skill 
      + ' seniority: ' + this.seniority
      + ' location: ' + this.location
      + ' english: ' + this.englishLevel 
      + ' bench: ' + this.benchStartDate ; 
    },

    // loads a normalized Glober's data from a row on the globers sheet
    normalizeGlober: function( rowValues ) {
      // A   0 +GloberID
      // B   1 +FirstName
      // C   2 +LastName
      // D   3 +Email
      // E   4  Birthdate
      // F   5  EntryDate
      // G   6 +Role
      // H   7 +Seniority
      // I   8  LegalID
      // J   9 +GloberOffice
      // K  10  Society
      // L  11 +EnglishLevel
      // M  12  Billable
      // N  13  MaxTimeAbroad
      // O  14  StartingOn
      // P  15  ArgentinePassport
      // Q  16  ArgPassEndDate
      // R  17  EuropeanPassport
      // S  18  EuropeanPassportEndDate
      // t  19  USPassport
      // U  20  USPassportEndDate
      // V  21  USVisa
      // W  22  USVisaType
      // X  23  USVisaExp
      // Y  24  OrganizationalUnit
      // Z  25  UploadCV
      // AA 26  LastDateSkillsReview
      // AB 27  GloberStudio
      // AC 28  Staff
      var // see getIndexes
        COL_GLOBER_ID = 0,
        COL_FIRST_NAME = 1,
        COL_LAST_NAME = 2,
        COL_EMAIL = 3,
        COL_SENIORITY = 7,
        COL_ROLE = 6,
        COL_GLOBER_OFFICE = 9,
        COL_ENGLISH_LEVEL = 11
      ;
      this.id = rowValues[COL_GLOBER_ID];
      this.name = rowValues[COL_FIRST_NAME] + ' ' + rowValues[COL_LAST_NAME];
      this.email = rowValues[COL_EMAIL];
      this.skill = rowValues[COL_LAST_NAMEZZZ];
      this.seniority = seniority; //int
      this.location = location; //string
      this.englishLevel = englishLevel; //int
      var benchData = getBenchRow( this.email );
      if( benchData ) {
      } else [
        // no bench start date
      }
      this.benchStartDate = benchStartDate; //date
      return this;

    }

}

