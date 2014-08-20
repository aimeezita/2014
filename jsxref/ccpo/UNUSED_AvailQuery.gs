
/*

function processAvailQueryEmails() 
{
  var threads = GmailApp.search('in:inbox', 0, 100);

  var label = GmailApp.getUserLabelByName("processed");
  
    Logger.log("a");
  for (var x=0; x<threads.length; x++) 
  {      
    var messages = threads[x].getMessages();
    Logger.log(threads[x].getFirstMessageSubject());
    for (var y=0; y<messages.length; y++) 
    {
        var msg = messages[y];
        var strQuery=msg.getSubject() +" "+msg.getBody();
        var values=getAvailGlobers(strQuery);
        var strHTMLTable=toHTMLTable(values, ["Name","Studio", "%", "Location","Skill", "Seniority","English","Handler Team","Source","Plan","Assignment Plan Ticket #","Bench Start Date","Aging"]);
        Logger.log(strHTMLTable);
        
    }
    //threads[x].markRead();
    //threads[x].addLabel(label);
    //threads[x].moveToArchive();
  }  
}


function answerEmailToSender(email, subject,body,htmlBody)
{
 
  if(!htmlBody)
    MailApp.sendEmail(email, subject, body);
  
}


function toHTMLTable(values, headers)
{
  var strTable="<table border='1'><tr>";
  for(var i=0;i<headers.length;i++)
    strTable+="<th>"+headers[i]+"</th>";
  strTable+="</tr>";

  
  for(var j=0;j<values.length;j++)
  {
    var theRow=values[j];
    strTable+="<tr>";
    for(var i=0;i<headers.length;i++)
      strTable+="<td>"+theRow[headers[i]]+"</td>";
    strTable+="</tr>";
    
  }
  strTable+="</table>";
  return strTable;
}


function test111()
{
 var values=getAvailGlobers("PHP cordoba");
  var strHTMLTable=toHTMLTable(values, ["Name","Studio", "%", "Location"]);//,"Skill", "Seniority","English","Handler Team","Source","Plan","Assignment Plan Ticket #","Bench Start Date","Aging"]);
        Logger.log(strHTMLTable);
}


function getAvailGlobers(strQuery) 
{
  var sheet = CCPOFileFinder.getPublicBenchSpreadsheet().getSheetByName("Available");
  var rowValues=getRows(sheet);
  var filteredResults=[];
  
  if (strQuery.length<1) return filteredResults;
  
  var wordsToSearch=strQuery.toLowerCase().trim().split(" ");
  if (wordsToSearch.length<1) return filteredResults;

  
  for(var j=0;j<rowValues.length;j++)
  {
    var theRow=rowValues[j];
    var rowAsString="";
    for(var key in theRow)
      rowAsString+=theRow[key]+" ";
    rowAsString=rowAsString.toLowerCase();
    var ignoreRow=false;
    for(var i=0;i<wordsToSearch.length;i++)
    {
      if (wordsToSearch[i] && wordsToSearch[i].length>0 && rowAsString.indexOf(wordsToSearch[i])<0)
      {
        //word not found, discard row
        ignoreRow=true;
        break;
      }
    }  
    if (!ignoreRow)
      filteredResults.push(theRow);
  }
  //Logger.log(filteredResults);
  
  return filteredResults;
}
  
  
*/
