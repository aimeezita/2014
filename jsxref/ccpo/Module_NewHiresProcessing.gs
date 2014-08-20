function computeNewHiresForecast_cron() 
{
  if (!CCPODateUtils.isWorkingDay()) return;
  
  var computation=new CCPONewHiresProcessingClass();
  
  var emailAddress="nicolas.gerpe@globant.com,mercedes.macpherson@globant.com,dario.robak@globant.com, analia.altieri@globant.com, bernardo.manzella@globant.com,delfina.montoya@globant.com";
  //emailAddress="dario.robak@globant.com";
  
  computation.computeForecast(emailAddress);
}

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPONewHiresProcessingClass()
{
  var errorList=new CCPOErrorListClass();
  var newHiresSheet =  getNewHiresSpreadsheet().getSheetByName("NEW HIRES");
  var newHiresRows = getRows(newHiresSheet);
  var headers=getSheetHeaders(newHiresSheet);
  var headersIdx=getHeaderIndexes(newHiresSheet);

/*
Headers:
Marca temporal	Nombre de usuario	DNI	Nombre y Apellido	Billable?	Position	
Si en la pregunta anterior contestaste "Otra", indicala a continuacion	
Seniority	Technical Interview	
Fecha de Ingreso	
Modalidad	Type	ExGlober?	Salary	% FDB	Vacaciones	Preocupacional	
Plan de Salud	Target de Bono	Inducción	Asignación	
Ticket/Studio/CECO	PM/Manager	Location	Office	Source	Glober Referente	
En caso de ser un portal de empleo, fue un aviso o busqueda en base?	Observaciones	Recruiter 1	Recruiter 2	
Team		
Cancelar ingreso?	English Level	Oficina de Preferencia	Unidad Organizativa
*/
  /////////////////////////////////////////////////////////////////
  this.computeForecast=function (emailAddress)
  {
    errorList.clear();
    var yearToCompute=new Date().getYear();
    var firstWeekToCompute=0;//getDateWeek(new Date())-4;
    var baseMonday=findWeekday(1,new Date()); 
    var baseMondayWeek=getDateWeek(baseMonday);
    
    var weekCounters={};
    var monthCounters={};
    
    for(var i=0;i<newHiresRows.length;i++)
    {
      var row=newHiresRows[i];
      var week,month;
      try
      {
        if (isEmptyString(row["Nombre y Apellido"])) continue;  //ignore empty rows
        if (!isEmptyString(row["Cancelar ingreso?"])) continue;   //ignore canceled rows
      
        var year=row["Fecha de Ingreso"].getYear();        
        week=getDateWeek(row["Fecha de Ingreso"]);
        month=row["Fecha de Ingreso"].getMonth()+1;
        if (year<yearToCompute)
          continue;
      }
      catch(e)
      {
        Logger.log("Error: "+row["Fecha de Ingreso"]+row["Nombre y Apellido"]);
        continue;
      }
     //Logger.log("Week:"+week+"  "+normalizeDate(row["Fecha de Ingreso"])+":"+row["Nombre y Apellido"]);
      if (week>=firstWeekToCompute)
      {
        var weekCounter=weekCounters[week];
        if (!weekCounter)
        {
          var daysCorrection=7*(week-baseMondayWeek);
          var date=normalizeDate(addDaysToDate(daysCorrection,baseMonday));
          weekCounter={dateComputed:normalizeDate(new Date()),week:week,date:date,newHires:0,newHiresBillable:0,newHiresStaff:0,newHiresTicket:0,newHiresUS:0};
          weekCounters[week]=weekCounter;
        }
        weekCounter.newHires++;
        if ("Billable"==row["Billable?"])
        {
          weekCounter.newHiresBillable++;
          if (row["Team"] && "PUSH TEAM"==row["Team"].toUpperCase())
          {
            weekCounter.newHiresUS++;
          }
        }
        else
          weekCounter.newHiresStaff++;
        
        if ("Ticket"==row["Asignación"])
          weekCounter.newHiresTicket++;
      }

      var monthCounter=monthCounters[month];
      if (!monthCounter)
      {
        monthCounter={dateComputed:normalizeDate(new Date()),month:month,newHires:0,newHiresBillable:0,newHiresStaff:0,newHiresTicket:0,newHiresUS:0};
        monthCounters[month]=monthCounter;
      }
      monthCounter.newHires++;
     
      if ("Billable"==row["Billable?"])
      {
        monthCounter.newHiresBillable++;
        if (row["Team"] && "PUSH TEAM"==row["Team"].toUpperCase())
        {
          monthCounter.newHiresUS++;        
        }
      }
      else
        monthCounter.newHiresStaff++;
      
      if ("Ticket"==row["Asignación"])
        monthCounter.newHiresTicket++;

    }
    Logger.log(monthCounters);

    var weekCounterArray=convertDictionaryToArray(weekCounters);
    weekCounterArray.sort(function(a,b){return b.week-a.week;});

    var outputHeaders=["dateComputed","week","date","newHires","newHiresBillable","newHiresStaff","newHiresTicket","newHiresUS"];
    var outputSheet=getTestingSpreadsheet().getSheetByName("NewHiresForecast");
   
    saveSheetObjs(outputHeaders,weekCounterArray,outputSheet,1000,true);

    var monthCounterArray=convertDictionaryToArray(monthCounters);
    monthCounterArray.sort(function(a,b){return b.month-a.month;});
    
    if (emailAddress)
    {
      var values=[monthCounterArray,weekCounterArray];
      var headers=[
        ["month","newHires","newHiresBillable","newHiresTicket","newHiresStaff","newHiresUS"],
        ["week","date","newHires","newHiresBillable","newHiresTicket","newHiresStaff","newHiresUS"]
      ];
      var titles=["Month Actuals","Week Actuals"];
      sendTableEmailFromObjs ("New Hires - Year  "+yearToCompute,emailAddress,values,headers,true,titles)
    }
  }    
  
  

}
