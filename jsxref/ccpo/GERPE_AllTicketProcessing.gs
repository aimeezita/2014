
function updateGerpeTicketsFields_cron() 
{
  var computation=new GerpeCCPOTicketsProcessingClass_();
  computation.updateTicketsFields();
}


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function GerpeCCPOTicketsProcessingClass_()
{
  var errorList=new CCPOErrorListClass();
  var spreadsheet=SpreadsheetApp.openById("1vcZ17mRImWaAk8QC0wKqgH8KAxdbsmRRYpQx31aHGbg");
  assert(spreadsheet,"cannot open spreadsheet");
  
  var ticketsSheet =  spreadsheet.getSheetByName("Tickets");
  assert(ticketsSheet,"cannot open sheet");
  
  var ticketsRows = getRows(ticketsSheet);
  var headers=getSheetHeaders(ticketsSheet);

  var accountsMap=computeMap(getAccountPrioritiesSheet(), "Account");
  
  /////////////////////////////////////////////////////////////////
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

      try{
        var thetime=row["Start Date"].getTime();
      }catch(e){
        Logger.log("Error en Start date:"+row.Number);
        row.Aging="BAD_START_DATE";
      continue;
      }
      row.Aging = Math.floor((today-row["Start Date"].getTime())/1000/3600/24);   //today()-N2
      //row.Stage	=arrayformula(if(U2:U>=0,"Stage 1",if(N2:N<=Constants!$B$2,"Stage 1 Sunday","Stage 2: week " & (weeknum(N2:N)))))
     
      
      row.Cluster ="Offshore";
      try{
        if (row["Client"].indexOf("Globant")>=0) row.Cluster ="Gbl";
        else if (row["Handler Team"].indexOf("pUSh team")>=0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("UK")==0) row.Cluster ="Onsite";
        else if (row["Work Office"].indexOf("EU")==0) row.Cluster ="Onsite";
        else if (row["Replacement"].indexOf("Yes")==0) row.Cluster ="A replacement";
      }  catch(e) {};
    
      row["Days to comply SLA"]=-row.Aging+row["Bucket (Weeks)"]*7;

      
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
      var bucket=getDaysOfComputedBucket(row["Work Office"], row.Position, row.Seniority, row["Client Interview Required?"], row.Client,row.Cluster);
      if (bucket==0)
        errorList.addError("Cannot compute bucket. Ticket: "+row.Number+" . ");
      row["Bucket (Weeks)"]=bucket/7;
      
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
      //emailsRecipients="dario.robak@globant.com";
      errorList.sendEmailWithErrors(emailsRecipients,"Tickets Without Bucket Process");
    }
    errorList.clear();

  }    

}















