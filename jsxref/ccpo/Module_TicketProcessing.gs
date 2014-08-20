
/***
This Module computes a list of tickets without handler and sends email informing the ticket number to responsibles
*/


function findTicketsWithProblems_cron() 
{
  if (!CCPODateUtils.isWorkingDay()) return;
  var outputSheet =getTestingSpreadsheet().getSheetByName("TicketsWithProblems");
  var computation=new CCPOTicketsProcessingClass();
  computation.findTicketsWithProblems(outputSheet,"dario.robak@globant.com, nicolas.gerpe@globant.com, analia.altieri@globant.com,veronica.gimenez@globant.com");
}

/*
//No longer needed as the tickets are imported from glow automatically
function updateTicketsFields_cron() 
{
   var computation=new CCPOTicketsProcessingClass();
  computation.updateTicketsFields("nicolas.gerpe@globant.com");
}
*/

function testsyncTicketsWithGlow() 
{
    var computation=new CCPOTicketsProcessingClass();
    computation.syncTicketsWithGlow("dario.robak@globant.com");
}

function generateTicketByBucketReport_cron() 
{
  var computation=new CCPOTicketsProcessingClass();
  var emails="nicolas.gerpe@globant.com,dario.robak@globant.com,analia.altieri@globant.com,bernardo.manzella@globant.com,mercedes.macpherson@globant.com";
  //emails="dario.robak@globant.com";
  computation.generateTicketByBucketReport(emails    );
Logger.log("end");
}

function sendEmailsAboutBucket() 
{
  var computation=new CCPOTicketsProcessingClass();
  computation.sendEmailsAboutBucket();
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/* Headers Ticket
Number	
Name	
Handler	
Submit Date	
Update Date	
Studio	
Glow Submitter	
Client	
Project	
Position	
Seniority	
Type of Assignment	
Load	
Start Date	
Work Office	
Estimated Travel Period	
Replacement	
Client Interview Required?	
Handler Team	
Stage	
Aging	
Priority	
OpenPosition	
Cluster	BU	
ProjectTag	
ProjectState	
Staffing Suggestions	
TL	
TD	
Bucket (Weeks)	
Days to comply SLA	
SeniorityRange	
bucketInformed
*/


function CCPOTicketsProcessingClass()
{
  var errorList=new CCPOErrorListClass();
//  var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
//  var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Glober ID");
  var ticketsSheet =  getBenchSpreadsheet().getSheetByName("Tickets");//getGlowImportSpreadsheet().getSheetByName("TicketsTS");
  var ticketsRows = getRows(ticketsSheet);
  var headers=getSheetHeaders(ticketsSheet);

  
  this.findTicketsWithProblems=function (outputSheet,emailsRecipients)
  {
    errorList.clear();
    var dateToUse=new Date();
    var results=[];
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];
      
      var handler=row.Handler;
      var handlerTeam=row["Handler Team"];
      var submitDate=row["Submit Date"];
      var number=row.Number;
     // Logger.log(number)
      if (dateToUse.getTime()-submitDate.getTime()<1000*60*60*48) //report only after 48hrs
          continue;

      var hasError=false;      

      ticketDescription= ""+ number+" (submitted "+normalizeDate(submitDate)+", aging: "+row.Aging+") "+row.Client+"/"+row.Project+"/"+row.Studio;
      if (isEmptyString(handlerTeam))
      {
        errorList.addError("No team: "+ticketDescription, "NOHANDLERTEAM");
        hasError=true;
      }
      else if (isEmptyString(handler))
      {
        errorList.addError("No handler: "+ticketDescription, "NOHANDLER");
        hasError=true;
      }

      if (isEmptyString(row.TD) && row.Client!="Globant")
      {
        errorList.addError("No TD: "+ticketDescription, "NOTD");
        hasError=true;
      }



      if (!hasError)
        continue;

      //Logger.log(row);
      results.push(row);
    }
    
    if (outputSheet)
    {
      saveSheetObjs(headers,results,outputSheet,1000);
    }
    
    var oneHourMillis=1000*60*60.0;
    if (emailsRecipients && hasElapsedEnoughTime("Tickets Without Handler Process_informErrors",23*oneHourMillis))
    {
      //emailsRecipients="dario.robak@globant.com";
      errorList.sendEmailWithErrors(emailsRecipients,"Tickets Without Handler Process");
    }
    errorList.clear();

  }    
  
  
  
  /////////////////////////////////////////////////////////////////
  /*
  this.updateTicketsFields=function (emailsRecipients)
  {
    errorList.clear();
    var ticketHeadersIdx=getHeaderIndexes(ticketsSheet);
    var projectRows=getRows(getGlowImportSpreadsheet().getSheetByName("Projects"));
    var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");
    
    //Columns to compute
    var columnsToCompute=["ProjectTag","ProjectState","Bucket (Weeks)","BU","TL","TD","Priority","SeniorityRange","Aging","Cluster","Days to comply SLA"];
    var today=new Date().getTime();
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];

      row.Aging = Math.floor((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
      //row.Stage	=arrayformula(if(U2:U>=0,"Stage 1",if(N2:N<=Constants!$B$2,"Stage 1 Sunday","Stage 2: week " & (weeknum(N2:N)))))
     
      
      row.Cluster ="Offshore";
      try{
      if (row["Type of Assignment"].indexOf("Vacation")>=0) row.Cluster ="Vacations";
      else if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
      else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
      else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
      else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
      else if (row["Replacement"].indexOf("Yes")==0) row.Cluster ="A replacement";
      }  catch(e) {};
    

      
      //Cumpute project tag
      row.ProjectTag="NOT_FOUND";
      for(var j=0; j<projectRows.length;j++)
      {
        var project=projectRows[j];
        if (project.Client==row.Client && project.Project==row.Project)
        {
          row.ProjectTag=project["Project Tag"];    
          row.ProjectState=project["Project State"];    
          row.BU=project["Business Unit"];
          row.TL=project["Current Technical Leaders"];
          row.TD=project["Current Technical Director"];
          break;
        }
      }
      if (row.ProjectTag=="NOT_FOUND")
        errorList.addError("Cannot compute project tag. Ticket: "+row.Number+" . ");
      
      //Compute Bucket
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,false);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;
      row["Days to comply SLA"]=-row.Aging+row["Bucket (Weeks)"]*7;
      
      //compute priority
      
      //=(vlookup(H240,Accounts!A:B,2,false)+U240*if(U240<0,2,1))*if(U240<0,1,if(Q240="Yes",0.5,1))
      var account=accountsMap[row.Client];
      var priority=0;
      if(account)
        priority+=account.PriorityPoints;
      
      var aging=row.Aging;
      var replacement=("Yes"==row.Replacement);
      if(aging)
      {
        if(aging<0)
          priority+=2*aging;
        else
          priority+=Math.floor(aging/(replacement?2:1));
      }
      row.Priority=priority; 
      
      //compute seniorityRange      
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
      {
        row["SeniorityRange"]="NOTFOUND"; 
      }

    }
    
    
    for(var j=0;j<columnsToCompute.length;j++)
    {
      var columnNumber=ticketHeadersIdx[columnsToCompute[j]];
      Logger.log(columnNumber);
      var values=new Array(ticketsRows.length);
      for(var i=0;i<ticketsRows.length;i++)
      {
        values[i]=new Array(1);
        values[i][0]=ticketsRows[i][columnsToCompute[j]];
      }
      ticketsSheet.getRange(2,columnNumber,values.length,1).setValues(values);
      
    }
    
    if (emailsRecipients)
    {
      var oneHourMillis=1000*60*60.0;
      //emailsRecipients="dario.robak@globant.com";
      if (hasElapsedEnoughTime("updateTicketsFields_informErrors",70*oneHourMillis))
        errorList.sendEmailWithErrors(emailsRecipients,"UpdateTicketsFields Process");
    }
    errorList.clear();

  }    
*/
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  this.syncTicketsWithGlow=function (emailsRecipients)
  {
    errorList.clear();
    
    var originalTicketsMap=computeMap(ticketsSheet, "Number");
    var accountsMap=computeMap(getAccountPrioritiesSheet(), "Account");


    var ticketsGlowSheet = getGlowImport2Spreadsheet().getSheetByName("TicketsGlow");
    var ticketHeadersIdx=getHeaderIndexes(ticketsGlowSheet);
    var ticketsGlowRows = getRows(ticketsGlowSheet);
    
    var projectRows=getRows(getGlowImportSpreadsheet().getSheetByName("Projects"));
    var seniorityRangeMap=computeMap(getBenchSpreadsheet().getSheetByName("Seniorities"), "Seniority");
    var today=new Date().getTime();
    //Columns to compute
    //var columnsToCompute=["ProjectTag","ProjectState","Bucket (Weeks)","BU","TL","TD","Priority","SeniorityRange"];
    
    var result=[];
    for(var i=0;i<ticketsGlowRows.length;i++)
    {
      var row=ticketsGlowRows[i];
      if (row.StageGlow=="Stage 3") continue;

      try
      {
        //Make sure the ticket number starts with #
        if (typeof row.Number === 'number')
          row.Number="#"+row.Number;
        
        row.Aging = Math.round((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
        row.Stage	=row.Aging>=0?"Stage 1":("Stage 2: week " +getDateWeek(row["Start Date"]));
      }
      catch(e) 
      {
        errorList.addError("Cannot compute STAGE. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+")");
        continue;
      };
        
      
      row.Cluster ="Offshore";
      try{
        /*if (row["Type of Assignment"].indexOf("Vacation")>=0) row.Cluster ="Vacations";
        else 
        */
        if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
        else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
        else if (row["Replacement"].indexOf("Yes")==0) 
        {
          if (isEmptyString(row["Replacement Type"]) || row["Replacement Type"].indexOf("PERMANENT")==0)
            row.Cluster ="A replacement";
          else
            row.Cluster ="Temp replacement";

        }
      } 
      
      catch(e) 
      {
        errorList.addError("Cannot compute cluster. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+")");
        continue;
      };
    
      
      //Cumpute project tag
        row.ProjectTag="NOT_FOUND";
        for(var j=0; j<projectRows.length;j++)
        {
          var project=projectRows[j];
          if (project.Client==row.Client && project.Project==row.Project)
          {
            row.ProjectTag=project["Project Tag"];    
            row.ProjectState=project["Project State"];    
            row.BU=project["Business Unit"];
            row.TL=project["Current Technical Leaders"];
            row.TD=project["Current Technical Director"];
            break;
          }
        }
        if (row.ProjectTag=="NOT_FOUND")
          errorList.addError("Cannot compute project tag. Ticket: "+row.Number+" ("+row.Client+"/"+ row.Project+"). ");
      
      //Compute Bucket
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,row.Cluster);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;
      row["Days to comply SLA"]=bucket-row.Aging;
      if (row["Days to comply SLA"]<0)
        row["Days to comply SLA"]="Overdue";
      
      //compute priority
      
      //=(vlookup(H240,Accounts!A:B,2,false)+U240*if(U240<0,2,1))*if(U240<0,1,if(Q240="Yes",0.5,1))
      var account=accountsMap[row.Client];
      var priority=0;
      if(account)
        priority+=account.PriorityPoints;
      
      var aging=row.Aging;
      var replacement=("Yes"==row.Replacement);
      if(aging)
      {
        if(aging<0)
          priority+=2*aging;
        else
          priority+=Math.floor(aging/(replacement?2:1));
      }
      row.Priority=priority; 
      
      //compute seniorityRange      
      var seniorityRange=seniorityRangeMap[row["Seniority"]];
      if (seniorityRange)
        row["SeniorityRange"]=seniorityRange.SeniorityRange;
      else
      {
        row["SeniorityRange"]="NOTFOUND"; 
      }

      
      
      //Save values given by the staffing team
      var originalTicket=originalTicketsMap[row.Number];
      if (originalTicket)
      {
        row.OpenPosition=originalTicket.OpenPosition;
        row.bucketInformed=originalTicket.bucketInformed;        
        if (isEmptyString(row.ProjectTag) || row.ProjectTag=="NOT_FOUND")
        {
          if (!isEmptyString(originalTicket.ProjectTag))
          {
            row.ProjectTag=originalTicket.ProjectTag;
          }
        }     

      }
      else
      {
        Logger.log("Cannot find originalTicket:"+row.Number);
      }
      
      result.push(row);
    }

    Logger.log("About to save tickets");
    var outputSheet =  ticketsSheet; //getBenchSpreadsheet().getSheetByName("New Tickets");
    assert(outputSheet,"Cannot open outputSheet");
    saveSheetObjs(headers,result,outputSheet,1000,false);
    Logger.log("Saved!");

    var oneHourMillis=1000*60*60.0;
    
    if (emailsRecipients && hasElapsedEnoughTime("SyncTicketsWithGlow_informErrors",70*oneHourMillis))
        errorList.sendEmailWithErrors(emailsRecipients,"Automatic sync of tickets with Glow process");

    errorList.clear();

  }    

  /************************************************************/
  function formatDate(currentDate)
  {
    if (!currentDate) return;
    return CCPODateUtils.asShortString(currentDate);
  }

  
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  this.generateTicketByBucketReport=function (emailsRecipients,BU)
  {    
    errorList.clear();
    var dateToUse=new Date();

    var cluster=[[],[]];  //2 arrays, first for offshore, second for onsite
    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];
      if (BU && BU!=row.BU)
        continue;
      if (row.Client=="Globant") continue; 
      
      var ticket={};
      ticket.number=row.Number;
      ticket.bucket=row["Bucket (Weeks)"];
      ticket.startDate=formatDate(row["Start Date"]);
      ticket.staffingWindowEnd=formatDate(addDaysToDate(ticket.bucket*7,row["Start Date"]));
      if (row["Days to comply SLA"]=="Overdue")
        ticket.remainingDaysNumber=-1;
      else
        ticket.remainingDaysNumber=row["Days to comply SLA"];
      
      if (ticket.remainingDaysNumber<0)
      {
        ticket.remainingDays="<B>Overdue</B>"
        ticket.htmlRowBGColor="red";//"#CC2222";
      }
      else
      {
        if (ticket.remainingDaysNumber<=13)
          ticket.htmlRowBGColor="yellow";
        else
        {
          if (row.Aging>=0)  //Stage 1
            ticket.htmlRowBGColor="green";
          else
            ticket.htmlRowBGColor="#C0C0C0";
            
        }
        ticket.remainingDays=ticket.remainingDaysNumber;
      }  
      ticket.client=row.Client;
      ticket.project=row.Project;
      ticket.position=row.Position;
      ticket.seniority=row.Seniority;
      ticket.location=row["Work Office"];
      ticket.interview=row["Client Interview Required?"];
      ticket.handler=row["Handler Team"];
      
      
      var arrayPosition=0;
      if (row.Cluster=="Onsite")
        arrayPosition=1;
      cluster[arrayPosition].push(ticket);
    }
//    cluster[0].sort(function(a,b){return 10000*(b.bucket-a.bucket)+a.remainingDaysNumber-b.remainingDaysNumber});
//    cluster[1].sort(function(a,b){return 10000*(b.bucket-a.bucket)+a.remainingDaysNumber-b.remainingDaysNumber});
//    cluster[0].sort(function(a,b){return compareStrings(a.staffingWindowEnd,b.staffingWindowEnd)});
//    cluster[1].sort(function(a,b){return compareStrings(a.staffingWindowEnd,b.staffingWindowEnd)});
    cluster[0].sort(function(a,b){return a.remainingDaysNumber-b.remainingDaysNumber});
    cluster[1].sort(function(a,b){return a.remainingDaysNumber-b.remainingDaysNumber});
    
    if (emailsRecipients)
    {
      var subject="Tickets by bucket report"+(BU?(" for "+BU):"");
      var headers=["bucket","number","client","startDate","staffingWindowEnd","remainingDays","position","interview","handler"];
      sendTableEmailFromObjs (subject,emailsRecipients, cluster, [headers,headers],true,["Tickets Offshore", "Tickets Onsite"]);
    }
    errorList.clear();

  }    
  
  
  
  this.sendEmailsAboutBucket=function ()
  {
    errorList.clear();
    var projectMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Projects"), "Project Tag");
    var globerMap=computeMap(getGlowImportSpreadsheet().getSheetByName("Globers"), "Email");
    var ticketHeadersIdx=getHeaderIndexes(ticketsSheet);

    var dateToUse=new Date();

    var columnNumber=ticketHeadersIdx["bucketInformed"];
    Logger.log(columnNumber);
    assert(columnNumber,"Canot find column bucketInformed in tickets sheet");
    var values=new Array(ticketsRows.length);

    var clientTicketsMap={};

    for(var i=0;i<ticketsRows.length;i++)
    {
      var row=ticketsRows[i];
      
      values[i]=[row.bucketInformed];
      var bucketInformed=row.bucketInformed;
      var number=row.Number;

      if (bucketInformed)
          continue;
      if ("Globant"==row.Client)
      {
        values[i]=[null];//["Globant"];
        continue;
      }
      var project=projectMap[row.ProjectTag];
      if (!project)
      {
        values[i]=[null];
        continue;
      }
      
      
      var emails=[];
      if (!isEmptyString(row["Glow Submitter"]))
        emails.push(row["Glow Submitter"]+"@globant.com");
        
      emails=addEmailsToArray(emails,project["Current Delivery Directors Emails"]);
      emails=addEmailsToArray(emails,project["Current Project Managers Emails"]);
      emails=addEmailsToArray(emails,project["Current Technical Director Email"]);
      emails=emails.filter(function(elem, pos, self) {
          return self.indexOf(elem) == pos;
        });

      values[i]=[normalizeDate(dateToUse)];
      
      
      
      //Group by client
      var clientTickets=clientTicketsMap[row.Client];
      if (!clientTickets)
      {
        clientTicketsMap[row.Client]={client:row.Client,tickets:[row],emailsToSendBucketInfo:emails};
      }
      else
      {
        clientTickets.tickets.push(row);
        emails=emails.concat(clientTickets.emailsToSendBucketInfo);
        clientTickets.emailsToSendBucketInfo = emails.filter(function(elem, pos, self) {
          return self.indexOf(elem) == pos;
        });
        
      }
    }

    sendEmailsAboutBucketToClientStakeholders(clientTicketsMap);
    
    //Update sheet informing when the email was sent
    ticketsSheet.getRange(2,columnNumber,values.length,1).setValues(values);
    errorList.clear();

  }    
  
  function addEmailsToArray(emails,values)
  {
    if (isEmptyString(values))
      return emails;
    var valuesSplitted=values.split(   " - " );
    //Logger.log(valuesSplitted);
    return emails.concat(valuesSplitted);
  }
  
  function sendEmailsAboutBucketToClientStakeholders (clientTicketsMap) 
  {
    for (var key in clientTicketsMap) 
    {
      var clientTickets=clientTicketsMap[key];
      Logger.log(clientTickets.client+"/"+clientTickets.tickets.length+"/"+clientTickets.emailsToSendBucketInfo);
    
      var subject="Bucket information on new tickets for client: "+clientTickets.client;
      
      var htmlTable="<body><center><h2>"+subject+"</h2><br />\r\n";
      htmlTable+="Below you can find the staffing window for the tickets recently added. Please review and make adjustments to the ticket to improve staffing times, if necessary<br /><br />\r\n"

      var values=[];
      var fields=["Ticket #","Project Name","Position","Bucket (Weeks)", "Staffing Window Start Date","Staffing Window End Date"];
      for(var i=0;i<clientTickets.tickets.length;i++)
      {
        var row=clientTickets.tickets[i];
        var value={};
        
        value["Ticket #"]=row.Number;
        value["Project Name"]=row.Project;
        value["Position"]=row.Position;
        value["Staffing Window Start Date"]=CCPODateUtils.asShortString(row["Start Date"]);
        value["Bucket (Weeks)"]=row["Bucket (Weeks)"];
        value["Staffing Window End Date"]=CCPODateUtils.asShortString(addDaysToDate(value["Bucket (Weeks)"]*7,row["Start Date"]));
        
        values.push(value);
      }      
      htmlTable+=convertArrayToHTML(values, fields);        
      htmlTable+="\r\n</center></body>\r\n";
      
      var emailRecipients=clientTickets.emailsToSendBucketInfo.join();
      emailRecipients="dario.robak@globant.com, nicolas.gerpe@globant.com";
      GmailApp.sendEmail(emailRecipients,subject,"This is an HTML email",{htmlBody: htmlTable});
      Logger.log("email enviado");
    };
    
  }

  
}















