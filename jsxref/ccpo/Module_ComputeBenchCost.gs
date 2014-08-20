
function computeBenchCost_cron() 
{
  var oneHourMillis=1000*60*60.0;
  
  var computation=new CCPOComputeBenchCostsClass();
  var costs=computation.computeAllCosts();
  
  
  if (true)
  {
    computation.saveCosts(costs);

    if (CCPODateUtils.isWorkingDay())
    {

      if (hasElapsedEnoughTime("ComputeBenchCost_informErrors",23*oneHourMillis))
        computation.informErrors("dario.robak@globant.com,nicolas.gerpe@globant.com,emanuel.prebende@globant.com");
      
      if (hasElapsedEnoughTime("ComputeBenchCost_emailToPartners",2*23*oneHourMillis))
        computation.sendEmailToPartners(costs,"techpartners@globant.com, vivian.sauksteliskis@globant.com, gaston.horvat@globant.com");
      
      if (hasElapsedEnoughTime("ComputeBenchCost_informExpensiveGlobers",2*23*oneHourMillis))
        computation.informExpensiveGlobers("dario.robak@globant.com,analia.altieri@globant.com,bernardo.manzella@globant.com");
    }
  }
  else
  {
    //computation.informErrors("dario.robak@globant.com");
    //computation.informExpensiveGlobers("dario.robak@globant.com");
      computation.sendEmailToPartners(costs,"dario.robak@globant.com");
  }

}



//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOComputeBenchCostsClass ()
{
  var errorList=new Array();
  var expensiveGloberList=new Array();
  var costByEmailMap=getCostsByEmailMap();
  
  function addError(errorMsg)
  {
    errorList.push(errorMsg);
    Logger.log(errorMsg);
  }

  /************************************************************/
  function getCostsByEmailMap()
  {
    var costsSheet =getSalariesSheet();
    
    var costsRows = getRows(costsSheet);
  
    var map={};
    for(var i=0;i<costsRows.length;i++)
    {
      var costRow=costsRows[i];
      var cost=costRow["CE USD+OS"];
      
      if (!isNumber(cost))
      {
        addError("Cost Error: "+costRow["Mail"]+":"+cost);
        continue;
      }
      map[costRow["Mail"]]=cost;
    }
    return map;
  }
        
  function isNumber(n) 
  {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  /************************************************************/
  function getCost(globerEmail)
  {
    
    if (globerEmail in costByEmailMap)
    {
      return costByEmailMap[globerEmail];
    }
    return -1;
  }
  /************************************************************/
  function formatCost(cost)
  {
    //return Math.floor(cost*100)/100;
    return Math.floor(cost);
  }

  /************************************************************/
  function addToProperty(obj,property,value)
  {
    if(!obj[property]) obj[property]=value;
    else obj[property]+=value
  }

  /************************************************************/
  this.computeAllCosts=function () 
  {
    var totalCosts={};
    totalCosts.headCount=0;
    totalCosts.cost=0;
    totalCosts.headCountOnsite=0;
    totalCosts.costOnsite=0;
    totalCosts.headCountOffshore=0;
    totalCosts.costOffshore=0;
    totalCosts.missingCosts=0;
    totalCosts.headCountBr=0;
    totalCosts.costBr=0;
    
    var benchSheet = getBenchSpreadsheet().getSheetByName("Available");
    var benchRows = getRows(benchSheet);

    for(var i=0;i<benchRows.length;i++)
    {
      var benchRow=benchRows[i];
      var email=benchRow.Email; //TODO: CHECK VALUE!
      
      var cost=2640; //This is the avg production CE
     
      

      if (email!="NH") 
      {
        var cost2=getCost(email);
        if (cost2==-1)
        {
//          addError("Can't find glober cost: "+email+"/"+benchRow.Location);
          addError(email);
          if (benchRow.Aging>=0) totalCosts.missingCosts++;
        }
        else
          cost=cost2;
      }         
      
      benchRow.cost=cost; //save the cost in the globers array (I love JS!)

      if (benchRow.Aging<0) continue;
      
      var percent=benchRow["%"]; //TODO: CHECK VALUE!
      if (percent<1) continue;

      cost=cost*percent/100;
      
      
      //Logger.log(email+","+benchRow.Aging+","+percent);

      totalCosts.headCount+=percent;
      totalCosts.cost+=cost;

      addToProperty(totalCosts,"studioheadcount__"+benchRow.Studio,percent);
      addToProperty(totalCosts,"studiocost__"+benchRow.Studio,cost);
      
      if (benchRow.Location && (benchRow.Location.indexOf("US") == 0 || benchRow.Location.indexOf("EU") == 0))
      {
        totalCosts.headCountOnsite+=percent;
        totalCosts.costOnsite+=cost;
      }
      else
      {
        totalCosts.headCountOffshore+=percent;
        totalCosts.costOffshore+=cost;
        if (benchRow.Location && benchRow.Location.toUpperCase().indexOf("BR") == 0)
        {
          totalCosts.headCountBr+=percent;
          totalCosts.costBr+=cost;
        }
      }


    }
    
    
    /** sort based on cost ***/
    benchRows.sort(function(a,b){return b.cost-a.cost});
    for(var i=0;i<benchRows.length;i++)
    {
      var benchRow=benchRows[i];
      //if (benchRow.Aging<-15) continue; //only see 15 days in advance
      if (benchRow.cost<4000) break; //only see expensive people
      expensiveGloberList.push(benchRow);
      Logger.log(formatCost(benchRow.cost)+":"+benchRow.Email + "(" + benchRow.Stage +")");
    }

    
    Logger.log(totalCosts);
    return totalCosts;
  }

  
  this.saveCosts=function (costs) 
  {
     var spreadsheet=getLogSpreadsheet();
     var sheet= spreadsheet.getSheetByName("DailyBenchCostUSD");
    
    var values=[new Date(), costs.headCount/100,formatCost(costs.cost),costs.headCountOffshore/100,formatCost(costs.costOffshore),costs.headCountOnsite/100,formatCost(costs.costOnsite),costs.missingCosts,costs.headCountBr/100,formatCost(costs.costBr)]; 
    sheet.appendRow(values);

    SpreadsheetApp.flush();
    
  }

  this.sendEmailToPartners=function (costs,emailRecipients) 
  {
    var values=[];
    
    for(var key in costs)
    {
      if (key.indexOf("studioheadcount__")!=0) continue;
      var studio=key.split("__")[1];
      values.push({studio:studio,headcount:costs[key],cost:costs["studiocost__"+studio]});
    }
    values.sort(function Comparator(a,b){if (a.studio < b.studio) return -1;if (a.studio > b.studio) return 1;return 0;});
    
    var date=normalizeDate(new Date());
    var htmlTable="<body><h2> Bench cost by studio: "+date+"</h2><br /><table border=1><tr><td>Studio</td><td>Headcount</td><td>Cost</td></tr>";
    for(var i=0;i<values.length;i++)
    {
      htmlTable+="<tr><td>"+values[i].studio+"</td><td align=right>"+values[i].headcount/100+"</td><td align=right>"+formatCost(values[i].cost)+"</td></tr>";
    }
    htmlTable+="<tr><td><b>Totals</b></td><td align=right><b>"+costs.headCount/100+"</b></td><td align=right><b>"+formatCost(costs.cost)+"</b></td></tr>";
    htmlTable+="</table>";
    
    /* Bodnar asked to remove this info
    expensiveGloberList.sort(function(a,b){return b.Aging-a.Aging;});
    htmlTable+="<h2> High priority globers without assignment</h2><br /><table border=1><tr><td>Email</td><td>Aging</td><td>Studio</td><td>Location</td><td>Skill</td><td>Seniority</td></tr>";
    for (var i=0;i<expensiveGloberList.length;i++)
    {
      var txt="<tr><td>"+expensiveGloberList[i].Email +"</td><td align=right>"+
        expensiveGloberList[i].Aging+"</td><td>"+
        expensiveGloberList[i].Studio+"</td><td>"+
        expensiveGloberList[i].Location+"</td><td>"+
          expensiveGloberList[i].Skill+"</td><td>"+expensiveGloberList[i].Seniority;

      htmlTable+=txt+"\r\n";
    }
    htmlTable+="</table>";
    
    */
    htmlTable+="</body>";

    GmailApp.sendEmail(emailRecipients,"Bench cost by studio: "+date,"This is an HTML email",{htmlBody: htmlTable});
  }

  this.informErrors=function (emailAddress) 
  {
    if (errorList.length<1) return; //nothing to report
    
     //send email to emailAddress    
    Logger.log("sending email to:"+emailAddress);

    var emailText="Daily Bench Cost Process\r\nError Report:\r\n";
    emailText=emailText+"# of errors:"+errorList.length+"\r\n";
    emailText=emailText+"--------------\r\n";

    for (var i=0;i<errorList.length;i++)
    {
      emailText=emailText+errorList[i]+"\r\n";
    }
    emailText=emailText+"--------------\r\n";
    MailApp.sendEmail(emailAddress, "Daily Bench Cost Process - Error Report", emailText);

  }
  
  
  this.informExpensiveGlobers=function (emailAddress) 
  {
     //send email to emailAddress    
    Logger.log("sending email to:"+emailAddress);
    expensiveGloberList.sort(function(a,b){return b.Email>a.Email?-1:(b.Email<a.Email?1:0);});

    var emailText="Daily Bench Report\r\High Priority Globers in Bench Report:\r\n";
    emailText=emailText+"# of Globers:"+expensiveGloberList.length+"\r\n";
    emailText=emailText+"--------------\r\nStage 1:\r\n";
    
    for (var i=0;i<expensiveGloberList.length;i++)
    {
      if (expensiveGloberList[i].Aging<0) continue;
      var txt=expensiveGloberList[i].Email + " /"+expensiveGloberList[i].Location+ "/"+expensiveGloberList[i].Skill+ "/"+expensiveGloberList[i].Seniority+"/("+expensiveGloberList[i]["%"]+"%) ";

      emailText=emailText+txt+"\r\n";
    }
    emailText=emailText+"--------------\r\nStage 2:\r\n";

    
    for (var i=0;i<expensiveGloberList.length;i++)
    {
      if (expensiveGloberList[i].Aging>=0) continue;
      var txt=expensiveGloberList[i].Email + " (" + expensiveGloberList[i].Stage +")/"+expensiveGloberList[i].Location+ "/"+expensiveGloberList[i].Skill+ "/"+expensiveGloberList[i].Seniority;

      emailText=emailText+txt+"\r\n";
    }
    emailText=emailText+"--------------\r\n";

    MailApp.sendEmail(emailAddress, "High Priority Globers in Bench Report", emailText);

  }

}
//////////////////////////////////////////////////////
