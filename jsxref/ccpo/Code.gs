
function myFunction() 
{
  Logger.log("current project has " + ScriptApp.getProjectTriggers().length + " triggers");
  var allTriggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < allTriggers.length; i++) 
  {
    var t=allTriggers[i];
    Logger.log("Trigger:"+t.getTriggerSource()+"/"+t.getEventType()+"/"+t.getHandlerFunction()+"/"+t.getTriggerSourceId());
    
  }

  
//  Logger.log(GmailApp.getAliases());
  
/*var a1=new aatest1Class();
  Logger.log("a1->"+a1.convertToString());
  var a2=new aatest1Class();
  Logger.log("a2->"+a2.convertToString());
  a1.set_ab(10,20);
  Logger.log("a1->"+a1.convertToString());
  Logger.log("a2->"+a2.convertToString());
*/
}




