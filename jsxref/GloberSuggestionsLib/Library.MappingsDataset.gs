/**************************************************/
function MappingsDataset() {
  this.skillsMap = {};
  this.senioritiesMap = {};
  this.englishLevelsMap = {};
  this.skillsCompatibilityMap = {};

  this.init = function(){
    this._fillSkillsMap();
    this._fillSenioritiesMap();
    this._fillEnglishLevelsMap();
    this._fillSkillsCompatibilityMap();
  }

  this._fillSkillsMap = function(){
    var i;
    var skillsSheet = getGlobersSuggestionsSkillsMappingSheet();
    var skillsValues = getRows(skillsSheet);
    for(i in skillsValues){
      var key = skillsValues[i]["Skill"]
      if((key) && key != ""){
        this.skillsMap[prepareKey(key)] = skillsValues[i]["Type"];
      }
    }
  }

  this._fillSenioritiesMap = function(){
    var i;
    var senioritiesSheet = getGlobersSuggestionsSenioritiesMappingSheet();
    var senioritiesValues = getRows(senioritiesSheet);
    for(i in senioritiesValues){
      var key = senioritiesValues[i]["Seniority"]
      if((key) && key != ""){
        this.senioritiesMap[prepareKey(key)] = senioritiesValues[i]["Level"];
      }
    }
  }

  this._fillEnglishLevelsMap = function(){
    var i;
    var englishLevelsSheet = getGlobersSuggestionsEnglishLevelsMappingSheet();
    var englishLevelsValues = getRows(englishLevelsSheet);
    for(i in englishLevelsValues){
      var key = englishLevelsValues[i]["English"]
      if((key) && key != ""){
        this.englishLevelsMap[prepareKey(key)] = englishLevelsValues[i]["Level"];
      }
    }
  }

  this._fillSkillsCompatibilityMap = function(){
    var i;
    var skillsCompatibilitySheet = getGlobersSuggestionsSkillsCompatibilityMappingSheet();
    var skillsCompatibilityValues = getRows(skillsCompatibilitySheet);
    for(i in skillsCompatibilityValues){
      var key = skillsCompatibilityValues[i]["Ticket skill"] + "|" + skillsCompatibilityValues[i]["Glober skill"];
      if((key) && key != ""){
        this.skillsCompatibilityMap[prepareKey(key)] = skillsCompatibilityValues[i]["Compatibility"];
      }
    }
  }
}

/**************************************************/
function testMapping() {
  Logger.log(1);
  return
  var mapping = new MappingsDataset();
  Logger.log(2);
  mapping.init();
  Logger.log(3);
  var result = mapping.skillsMap[prepareKey("JAVA Developer")];
  Logger.log(result);
}
