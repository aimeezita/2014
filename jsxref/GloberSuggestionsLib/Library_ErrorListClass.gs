//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
function CCPOErrorListClass () {
  var errorList=new Array();

  this.addError=function(errorMsg,errorType) {
    if (!errorType) errorType="ERROR";
    errorList.push({error:errorMsg,type:errorType});
    Logger.log(errorType+":"+errorMsg);
  }
  this.clear=function() {
    errorList=new Array();
  }

  this.sendEmailWithErrors=function (emailAddress,subject,errorType) {    
    var filteredErrorList=new Array();
    if (errorType) {
      for (var i=0;i<errorList.length;i++) {
        if (errorList[i].type==errorType) {
          filteredErrorList.push(errorList[i]); 
        }
      }
    } else {
      filteredErrorList=errorList;
    }

    if (filteredErrorList.length < 1) { return false; } //nothing to report

    // send email to emailAddress    
    Logger.log("sending email to:" + emailAddress);

    var emailText=subject + "\r\nError Report:\r\n";
    emailText=emailText + "# of errors:" + filteredErrorList.length + "\r\n";
    emailText=emailText + "--------------\r\n";

    for (var i=0;i<filteredErrorList.length;i++) {
      emailText=emailText+filteredErrorList[i].error+"\r\n";
    }
    emailText=emailText+"--------------\r\n";
    MailApp.sendEmail(emailAddress, subject, emailText);
    return true;
  }
}

