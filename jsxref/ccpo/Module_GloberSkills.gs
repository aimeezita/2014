function CCPOGloberSkillsClass()
{

  // contains sheets: skillsSheet, Skills, GloberSkills
  var skillsSpreadsheet = getGloberSkillsSpreadsheet();

  // skill names and ids: id, category_id, name, path
  var skillsSheet = skillsSpreadsheet.getSheetByName( 'Skills' );  
  var skillsSheetRows = getRows( skillsSheet );
  for( var isks = 0; isks < skillsSheetRows.length; isks++ ) 
  {
    skillsSheetRows[isks]['name'] = skillsSheetRows[isks]['name'].toLowerCase();
  }
  // maps lowercase skill names to skill ids
  var skillIdsBySkillNameMap = computeMap( skillsSheet, 'name' );

  // positions to skill sets mapping CCPOdb:GloberSkills.PositionToSkillsMapping
  // maps a position name to a set of the required skills, with weights
  var positionToSkillsMappingSheet = skillsSpreadsheet.getSheetByName( 'PositionToSkillsMapping' );

  
  // list of globers and their skills: ID Glober, ID Skill, Knowledge
  var globerSkillsSheet = skillsSpreadsheet.getSheetByName( 'GloberSkills' );  
  var globerSkillsRows;
  var globerToSkillsMap;



  /************************************************************/
  this.hasCompatibleSkills = function( position, globerSkills, info ) 
  // calculate the fit of a glober for a position, based on the glober`s skills
  // set and a mapping from positions to skills requirements stored in the
  // CCPOConfiguration.PositionToSkillsMapping sheet
  {
    info = {};
    info.matchingLoss = 21;                                       // THIS IS A STUB
    info.matchingReasons = '*** test ***';                        // THIS IS A STUB
    return true;                                                  // THIS IS A STUB
  }

  /************************************************************/
  this.getSkillIdByName = function( skillName ) 
  // returns the skill code for the skillName argument
  {
    return skillIdsBySkillNameMap[ skillName.toLowerCase() ];
  }
  
  /************************************************************/
  this.getGloberSkills = function( globerId ) 
  // returns the glober`s skills as an array of 2-element arrays 
  // thus: [skillId, knowledgeLevel]
  // if ghe glober has no skills (totally dumb) return an enpty array
  {
    if( ! globerToSkillsMap ) { Logger.log( 'buildGloberToSkillsMap started' ); globerToSkillsMap = this.buildGloberToSkillsMap(); Logger.log( 'buildGloberToSkillsMap ran' ); }
    var gs = globerToSkillsMap[globerId];
    if( gs ) 
    {
      return gs;
    } else {
      return [];
    } 
  }
  
  /************************************************************/
  this.buildGloberToSkillsMap = function() 
  // returns a map keyed by globerId containing an array of 2-element
  // arrays thus: [skillId, knowledgeLevel]
  {
    if( ! globerSkillsRows ) { globerSkillsRows = getRows( globerSkillsSheet ); }
    var globerToSkillsMap = {};
    var i = 0;
    while( i < globerSkillsRows.length )
    {
      var ctrolGlober = globerSkillsRows[i]['ID Glober'];
      var oneGloberSkills = [];
      
      while( i < globerSkillsRows.length && globerSkillsRows[i]['ID Glober'] === ctrolGlober ) 
      {
        var thisRow = globerSkillsRows[i];
        oneGloberSkills.push( [ thisRow['ID Skill'], thisRow['Knowledge'] ] );
        i++;
      }
      globerToSkillsMap[ctrolGlober] = oneGloberSkills;
    }
    return globerToSkillsMap;
  };

  /************************************************************/
  this.globerSkillsFilterByLevel = function( aGloberSkills, kLevel ) {
  // filter a glober`s skills by level, return an array of only the skill
  // codes that had a knowledge level greter or equal than kLevel
    skillsFiltered = [];
    for( var i = 0; i < aGloberSkills.length; i++ )
    {
      var ags = aGloberSkills[i];
      if( ags['Knowledge'] >= kLevel ){
        skillsFiltered.push( ags['ID Skill'] );
      }
    }
    return skillsFiltered;
  };




  
  /************************************************************/
  /* function sortGloberSkillsFunction( a, b ) 
  // sort by glober id comparator
  {
    if( a['ID Glober'] < b['ID Glober'] ) { return -1; }
    if( a['ID Glober'] > b['ID Glober'] ) { return 1; }
    return a.Knowledge - b.Knowledge;
  } */
  
  /************************************************************/
  /* this.getGloberSkillsByEmail = function ( email, minValue )
  // return the glober`s skills in an array, witj level not less than the
  // minValue threshold, sorted by glober and knowledge (not skill id)
  {
    var globerMapByEmail = computeMap( getGlowImportSpreadsheet().getSheetByName( 'Globers' ), 'Email' );
    var glober = globerMapByEmail[email];
    if( !glober ) { throw ( 'Invalid Glober' ); }
    return this.getGloberSkills( glober['Glober ID'], minValue );
  } */
  
  /************************************************************/
  /* this.getGloberSkills = function ( globerId, minValue )
  // return the glober`s skills in an array, witj level not less than the
  // minValue threshold, sorted by glober and knowledge (not skill id)
  {
    globerSkillsRows.sort( sortGloberSkillsFunction ); // moved
    var result = [];
    for( var i = 0; i < globerSkillsRows.length; i++ )
    {
      var row = globerSkillsRows[i];
      if( row['ID Glober'] != globerId ) { continue; }
      if( row['Knowledge'] < minValue ) { continue; }
      
      var skill = allSkills[row['ID Skill']];
      var resultValue = { globerId:globerId, skillId:row['ID Skill'], skillName:skill.name,
      skillPath:skill.path, knowledge:row['Knowledge'] }
      
      result.push( resultValue );
    }
    result.sort( function( a, b ){return b.knowledge - a.knowledge; }  );
    return result;
  } */
  
  /************************************************************/
  /* this.getGlobersWithSkills = function ( skillsToSearch, minValue )
  // returns an array with the glober ids that have all the skills named in
  // the skillsToSearch array, at least at the minValue level
  // $$$$ should be a minValue for each skill, that is, the argument should
  // be an array of (skill, minLevel) pairs
  {
    var globerMapById = computeMap( getGlowImportSpreadsheet().getSheetByName( 'Globers' ), 'Glober ID' );
    minValue = minValue || 4;
    skillsToSearch = skillsToSearch.join( '###' ).toLowerCase().split( '###' );
    
    var result = [];
    var lastGloberId = '';

    for( var i = 0; i < globerSkillsRows.length; i++ )
    // loop over all (glober, skill) pairs, about 120K
    {
      if( globerSkillsRows[i]['Knowledge'] < minValue ) { continue; }
      var globerId = globerSkillsRows[i]['ID Glober'];
      if( globerId ==lastGloberId  )        
        continue; //already handled
      
      lastGloberId = globerId;
      var globerSkills = [];
      
      for( var j = i; j < globerSkillsRows.length; j++ )
      {
        var theGloberSkillInfo = globerSkillsRows[j];
        if( theGloberSkillInfo['Knowledge'] < minValue ) { continue; }
        if( globerId != theGloberSkillInfo['ID Glober'] ) { break; }
        var tempskill = allSkills[theGloberSkillInfo['ID Skill']];
        if( tempskill != null ) 
        {
          globerSkills.push( tempskill );
        } else {
          Logger.log( 'Cannot find skill ID: ' + theGloberSkillInfo['ID Skill'] );
        }
      }
      
      var globerHasAllSkills = true;
      for( var j = 0; j < skillsToSearch.length; j++ )
      {
        for( var k = 0; k < globerSkills.length; k++ )
        {
          var found = false;
          var theSkill = globerSkills[k];
          
          if( theSkill.name.toLowerCase().indexOf( skillsToSearch[j] ) >= 0 )
          {
            found = true;
            break;
          }      
        }
        if( !found )
        {
          globerHasAllSkills = false; //this glober doesnt have all skills
          break;
        }
      }
      if( globerHasAllSkills )
        result.push( globerMapById[globerId] );
    }
    return result;
  }
  
  
} */






/* function test_testasdert()
{
  var globerSkills = new CCPOGloberSkillsClass();
  //var result = globerSkills.getGloberSkills( 1003, 5 );
  //Logger.log( result );

  /*
  var result = globerSkills.getGloberSkillsByEmail( 'jose.forero@globant.com', 2 );
  Logger.log( result );
  return;
  
  var results = globerSkills.getGlobersWithSkills( ['python'], 4 );
  //Logger.log( results );
  
  var outputSheet = getTestingSpreadsheet( ).getSheetByName( 'FindGlobersWithSkillOutput'  );
  var headers = getSheetHeaders( outputSheet );
  saveSheetObjs( headers, results, outputSheet, 1000, false ); 

  result = globerSkills.getGlobersWithSkills( ['java', '.net'], 5 );
  Logger.log( result );
  result = globerSkills.getGlobersWithSkills( ['ruby'], 4 );
  Logger.log( result );
*/
}






