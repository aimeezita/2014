function test_testasdert()
{
  var globerSkills=new CCPOGloberSkillsClass();
  //var result=globerSkills.getGloberSkills(1003,5);
  //Logger.log(result);

  /*
  var result=globerSkills.getGloberSkillsByEmail("jose.forero@globant.com",2);
  Logger.log(result);
  return;
  */
  
  var results=globerSkills.getGlobersWithSkills(["python"],4);
  //Logger.log(results);
  
  var outputSheet=getTestingSpreadsheet().getSheetByName("FindGlobersWithSkillOutput");
  var headers=getSheetHeaders(outputSheet);
  saveSheetObjs(headers,results,outputSheet,1000,false);

/*
  result=globerSkills.getGlobersWithSkills(["java",".net"],5);
  Logger.log(result);
  result=globerSkills.getGlobersWithSkills(["ruby"],4);
  Logger.log(result);
*/
}
  

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOGloberSkillsClass()
{

  var spreadsheet = getGloberSkillsSpreadsheet();
  var skillsSheet=spreadsheet.getSheetByName("Skills");  
  var globerSkillsSheet=spreadsheet.getSheetByName("GloberSkills");  
  var globerMapById=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var globerMapByEmail=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");

  var allGlobersSkills=getRows(globerSkillsSheet);
  var allSkills=computeMap(skillsSheet, "id");
  allGlobersSkills.sort(sortGloberSkillsFunction);
  
  function sortGloberSkillsFunction(a,b) 
  {
    if (a["ID Glober"] < b["ID Glober"])
      return -1;
    if (a["ID Glober"] > b["ID Glober"])
      return 1;
    
    return a.Knowledge-b.Knowledge;
  }
  
  /************************************************************/
  this.getGloberSkillsByEmail=function (email,minValue)
  {
    var glober=globerMapByEmail[email];
    if (!glober) 
      throw ("Invalid Glober");
    return this.getGloberSkills(glober["Glober ID"],minValue);
  }
  
  /************************************************************/
  this.getGloberSkills=function (globerId,minValue)
  {
    var result=[];
    for(var i=0;i<allGlobersSkills.length;i++)
    {
      var row=allGlobersSkills[i];
      if (row["ID Glober"]!=globerId)
        continue;
      if (row["Knowledge"]<minValue)
        continue;
      
      var skill=allSkills[row["ID Skill"]];
      var resultValue={globerId:globerId,skillId:row["ID Skill"],skillName:skill.name,skillPath:skill.path,knowledge:row["Knowledge"]}
      
      result.push(resultValue);
      
    }
    result.sort(function(a,b){return b.knowledge-a.knowledge;});
    return result;
  }

  
  /************************************************************/
  this.getGlobersWithSkills=function (skillsToSearch,minValue)
  {
    minValue=minValue||4;
    for(var j=0;j<skillsToSearch.length;j++)
      skillsToSearch[j]=skillsToSearch[j].toLowerCase();

    
    var result=[];
    var lastGloberId="";

    for(var i=0;i<allGlobersSkills.length;i++)
    {
      if (allGlobersSkills[i]["Knowledge"]<minValue)
        continue;
      var globerId=allGlobersSkills[i]["ID Glober"];
      if (globerId==lastGloberId )        
        continue; //already handled
      
      lastGloberId=globerId;
      var globerSkills=[];
      
      for(var j=i;j<allGlobersSkills.length;j++)
      {
        var theGloberSkillInfo=allGlobersSkills[j];
        if (theGloberSkillInfo["Knowledge"]<minValue)
          continue;
        if (globerId!=theGloberSkillInfo["ID Glober"])        
          break; 
        var tempskill=allSkills[theGloberSkillInfo["ID Skill"]];
        if (tempskill!=null)
          globerSkills.push(tempskill);
        else
          Logger.log("Cannot find skill ID: "+theGloberSkillInfo["ID Skill"]);

      }
      
      var globerHasAllSkills=true;
      for(var j=0;j<skillsToSearch.length;j++)
      {
        for(var k=0;k<globerSkills.length;k++)
        {
          var found=false;
          var theSkill=globerSkills[k];
          
          if (theSkill.name.toLowerCase().indexOf(skillsToSearch[j])>=0)
          {
            found=true;
            break;
          }      
        }
        if (!found)
        {
          globerHasAllSkills=false; //this glober doesnt have all skills
          break;
        }
      }
      if (globerHasAllSkills)
        result.push(globerMapById[globerId]);
    }
    return result;
  }
  
  
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/*** NO ES USADA!!!   */

function CCPOBitArrayClass(_size,_initialBit)
{
  var size=_size;
  var bits=new Array(size);
  
  if (!_initialBit) _initialBit=false;
  
  for(var i=0;i<size;i++)
    bits[i]=_initialBit;
  
  /************************************************************/
  this.set=function (n,bit)
  {
    assert(n>=0,"n:"+n);
    assert(n<size,"BitArray size:"+size+", n:"+n);
    bits[n]=bit;
  }
  
  /************************************************************/
  this.get=function (n,bit)
  {
    assert(n>=0,"n:"+n);
    assert(n<size,"BitArray size:"+size+", n:"+n);
    return bits[n];
  }

  /************************************************************/
  this.allOn=function ()
  {
    for(var i=0;i<size;i++)
      if (bits[i]) return false;
    return true;
    
  }
  
}