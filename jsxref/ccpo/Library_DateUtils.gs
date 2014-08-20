
var CCPODateUtils=new CCPODateUtilsClass ();

function test__CCPODateUtils ()
{
  var today=new Date();
  
  for(var i=0;i<10;i++)
  {
    Logger.log("today+"+i+"="+CCPODateUtils.asDateString(today));
    Logger.log("getDate="+(today.getDay()));
    Logger.log("isWorkingDay="+CCPODateUtils.isWorkingDay(today));
    Logger.log("makeWorkingDay="+CCPODateUtils.asDateString( CCPODateUtils.makeWorkingDay(today)));
    today=CCPODateUtils.addDays(1,today);
  }
}

//**************************************************
//**************************************************
function CCPODateUtilsClass ()
{
  var month = new Array();
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";

  //**************************************************
  // Returns <0 if date1<date2, >0 if date2>date1, and 0 if they are equal   
  this.compareDates=function (date1,date2)
  {
    if (!date1)
      return (!date2)?0:-1;
    if (!date2)
      return 1;
    return date1.getTime()-date2.getTime();
  }


  //**************************************************
  this.addDays=function(daysToAdd,date) 
  {
    var ret = new Date(date||new Date());
    ret.setDate(ret.getDate() + daysToAdd);
    return ret;
  }

  //**************************************************
  this.makeWorkingDay=function (date) 
  {
    var weekday=date.getDay();
    if (weekday==6)  //Saturday
      return this.addDays(2,date);
    else if (weekday==0) //Sunday
      return this.addDays(1,date);
    else 
      return date;
  }
  
  //**************************************************
  this.isWorkingDay=function (date) 
  {
    if (!date) date=new Date();
    var weekday=date.getDay();
    if (weekday==0) //Sunday
      return false;
    else if (weekday==6) //Saturday
      return false;
    else 
      return true;
  }

  //**************************************************
  this.findWeekday=function (weekday,date) 
  {
    weekday=weekday%7;
    var ret = new Date(date||new Date());
    var daysToAdd=(weekday - 1 - ret.getDay() + 7) % 7 + 1;
    if (daysToAdd>0 && daysToAdd<7)
      ret.setDate(ret.getDate() + daysToAdd);
    return ret;
  }
  
  //**************************************************
  this.getWeekOfYear=function(date_)
  {
    var date = new Date(date_); 
    date.setHours(0, 0, 0, 0); 
    // Thursday in current week decides the year. 
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7); 
    // January 4 is always in week 1. 
    var week1 = new Date(date.getFullYear(), 0, 4); 
    // Adjust to Thursday in week 1 and count number of weeks from date to week1. 
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7); 
  }
  
  //**************************************************
  this.asDateString=function(currentDate)
  {
    if (!currentDate) return;
    var result= currentDate.getFullYear()+ String("0" + (currentDate.getMonth()+1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
    //Logger.log(result + ":"+currentDate);
    return result;
  }

  //**************************************************
  this.asDateString=function(currentDate)
  {
    if (!currentDate) return;
    var result= currentDate.getFullYear()+ String("0" + (currentDate.getMonth()+1)).slice(-2) + String("0" + currentDate.getDate()).slice(-2)
    //Logger.log(result + ":"+currentDate);
    return result;
  }

  //**************************************************
  this.asShortString=function(currentDate)
  {
    if (!currentDate) return;
    var result= String("0" + currentDate.getDate()).slice(-2)+"-"+month[currentDate.getMonth()]; 
    //Logger.log(result + ":"+currentDate);
    return result;
  }
}
