
/***********************************************************************************************************************/
function getDaysOfComputedBucket(location, skill, seniority, interviewRequired, client,cluster) 
{
  if( 
    toLower(client) != "globant"      && 
    toLower(skill) != "bis manager"   && 
    toLower(skill) != "transactional services manager" 
    ) 
    return 7 * callComputeBucket_(location, skill, seniority, interviewRequired,cluster).smartStaffingTimesAgreement;
  else 
    return 7*7;
}


function test_getDaysOfComputedBucket()
{
  var location="AR/BsAs/GLB-NorthPark";
  var skill="Staffing Manager";
  var seniority="Sr";
  var interviewRequired="No";
  var client="Bally Technologies";
  var bucket=getDaysOfComputedBucket(location, skill, seniority, interviewRequired, client,"offshore");
  Logger.log(bucket);
      
      //getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,false);

}

/***********************************************************************************************************************/
function callComputeBucket_(location, skill, seniority, interviewRequired,cluster) {
  
  location = toLower(location);
  skill = toLower(skill);
  seniority = toLower(seniority);
  interviewRequired = (toLower(interviewRequired) == "yes");
  cluster = toLower(cluster);
  
  var valueToAdjust=0;
//  if (internalAdjust) valueToAdjust=1;
  
  if( matchesBucket1(location, skill, seniority, interviewRequired,cluster) ) 
  {
    return bucket1();
  } 
  else if( matchesBucket2(location, skill, seniority, interviewRequired,cluster) ) 
  {
    var result=bucket2();
    result.smartStaffingTimesAgreement-=valueToAdjust;
    return result;
  } 
  else if( matchesBucket3(location, skill, seniority, interviewRequired,cluster) ) 
  {
    var result=bucket3();
    result.smartStaffingTimesAgreement-=valueToAdjust;
    return result;
    
  } 
  else if( matchesBucket4(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket4();
  } else if( matchesBucket5(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket5();
  } else if( matchesBucket6(location, skill, seniority, interviewRequired,cluster) ) {
    return bucket6();
  } else {
    return nobucket();
  }
}


/***********************************************************************************************************************/
var MAIN_TECH_SKILLS = {
  ".net developer" : true,
  "business analyst" : true,
  "graphic designer" : true,
  "visual designer" : true,
  "html designer" : true,
  "java developer" : true,
  "php developer" : true,
  "qc analyst" : true,
  "analyst_fa" : true,
  "quality assurance analyst" : true,
  "test automation engineer" : true,
  "sharepoint developer" : true,
  "test automation engineering" : true,
  "qc automation" : true,
  "game tester" : true,
  "qc game analyst" : true,
  "software engineer - ui" : true,
  "web ui developer" : true
  
};
function skillIsMainTech(skill) {
  return MAIN_TECH_SKILLS[skill] == true;
}

var TEACH_LEAD_SKILLS = {
  "lead" : true,
  "leader" : true,
  "tech lead" : true,
  "techlead"  : true,
  "team lead" : true,
  "architect" : true,
  "software designer" : true,
  "team lead-it qual assur" : true,
  "tech mgr i-sys/architecture" : true,
  "tech master" : true
};
function skillIsTechLead(skill) {
  return TEACH_LEAD_SKILLS[skill] == true;
}

function positionIsTechLead(position) {
  return position.indexOf("tl") >= 0;
}


var OPERATIONS_SKILLS = {
  "project analyst" : true,
  "project manager" : true,
  "staff manager" : true,
  "agile project manager" : true,
  "staffing manager" : true,
  "team lead-it proj mgt" : true,
  "tech mgr i-it proj mgt" : true,
};
function skillIsOperations(skill) {
  return OPERATIONS_SKILLS[skill] == true;
}


var MOBILE_TECH_SKILLS = {
  "android mobile developer" : true,
  "ios mobile developer" : true,
  "mobile developer" : true,
  "windows mobile developer" : true,
  "blackberry developer" : true,
  "hybrid mobile developer" : true
};
function skillIsMobileTech(skill) {
  return MOBILE_TECH_SKILLS[skill] == true;
}


var SECONDARY_SKILLS = {
  "business intelligence" : true,
  "action script developer" : true,
  "help desk pro" : true,
  "database administrator" : true,
  "drupal developer" : true,
  "net engineer" : true,
  "unity developer" : true,
  "user experience designer" : true,
  "python developer" : true,
  "qci analyst" : true,
  "consultant" : true,
  "ruby developer" : true,
  "perl developer" : true,
  "specialist engineer" : true,
  "sql developer" : true,
  "sysadmin engineer" : true,
  "data architecture engineer" : true,
  "cloud architect (aws)" : true,
  "data scientist" : true,
  "content analyst" : true,
  "product champion" : true,  
  "big data architect leader" : true,
  "load & performance specialist" : true,
  "post- production leader" : true,
  "c++ developer" : true,
  "security specialist" : true,
  "server administrator" : true,
  "interface designer" : true,
  "internet marketing analyst" : true,
  "pl admin" : true,
  "product analyst" : true,
  "client partner" : true,
  "web analytics specialist" : true,
  "game designer" : true
  
};
function skillIsSecondary(skill) {
  return SECONDARY_SKILLS[skill] == true;
}


/***********************************************************************************************************************/
function matchesBucket1(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);
	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		||
		(
			skillIsOperations(skill)
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket2(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			skillIsOperations(skill)
			&& !isOnsite_(location,cluster)
		)
		||
		(
			(skillIsTechLead(skill) || seniorityNdx > 6)
			&& !interviewRequired
			&& isAnywhere_(location)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket3(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMobileTech(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			seniorityNdx > 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			skillIsSecondary(skill)
			&& seniorityNdx <= 6
			&& !isOnsite_(location,cluster)
		)
		||
		(
			(skillIsTechLead(skill) || seniorityNdx > 6)
			&& (!isAnywhere_(location) || interviewRequired)
			&& !isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket4(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			skillIsMainTech(skill)
			&& seniorityNdx <= 6
            && isOnsite_(location,cluster)
		)
		||
		(
			skillIsOperations(skill)
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket5(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			((skillIsMainTech(skill) && seniorityNdx > 6) || skillIsTechLead(skill))
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
function matchesBucket6(location, skill, seniority, interviewRequired,cluster) {
	var seniorityNdx = getSeniorities().indexOf(seniority);

	var matches =
		(
			(skillIsMobileTech(skill) || skillIsSecondary(skill))
			&& seniorityNdx <= 6
            && isOnsite_(location,cluster)
		)
		||
		(
			seniorityNdx > 6
            && isOnsite_(location,cluster)
		)
		||
		(
			(
              ((skillIsMobileTech(skill) || skillIsSecondary(skill)) 
              && seniorityNdx > 6) || skillIsTechLead(skill)
            )
            && isOnsite_(location,cluster)
		)
		;

	return matches;
}

/***********************************************************************************************************************/
//function is___Specific_(location,cluster) { return !isOnsite_(location,cluster) && !isAnywhere_(location); }
function isOnsite_(location,cluster) { return "onsite"==cluster; }
function isAnywhere_(location) { return location == "anywhere"; }

/***********************************************************************************************************************/
function getSeniorities() {
	return ["tr", "tr adv", "jr", "jr adv", "ssr", "ssr adv", "sr", "sd", "architect", "sr adv", "tech master"];
}

/***********************************************************************************************************************/
function nobucket() { return bucketN(0, 0); }
function bucket1() { return bucketN(1, 3); }
function bucket2() { return bucketN(2, 5); }
function bucket3() { return bucketN(3, 7); }
function bucket4() { return bucketN(4, 4); }
function bucket5() { return bucketN(5, 5); }
function bucket6() { return bucketN(6, 6); }

function bucketN(bucketNum, smartStaffingTimesAgreement) {
	return {"bucketNum": bucketNum, "smartStaffingTimesAgreement" : smartStaffingTimesAgreement};
}


