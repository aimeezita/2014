
function startScheduler_cron() 
{  
  var configCls = new CCPOConfigClass();
  var configTable = configCls.getConfig('Scheduler');
  var config = tableToConfig(configTable);
            
  var scheduler = new CCPOTaskSchedulerClass(config);
  
  //register handlers
  //scheduler.registerHandler('IMPORT_GLOBERS', TEST_FUNCTION); //test function: test.gs
  //scheduler.registerHandler('PROCESS_GLOBERS', TEST_FUNCTION); //test function: test.gs
  //scheduler.registerHandler('COMPUTE_BENCH_COST', TEST_FUNCTION); //test function: test.gs
  
  scheduler.start();
}


//CCPOTaskSchedulerClass class
var CCPOTaskSchedulerClass = function (config) {
  //returns a new instance of the class if called without the new operator
  if(this instanceof CCPOTaskSchedulerClass === false) { return new CCPOTaskSchedulerClass(config); }
  
  this.schedulerName = config.schedulerName;
  this.tasks = config.tasks;
  this.handlers = {};
  
  this.dateService = { getDate: function() { return new Date(); } };
  this.driveService = DriveApp;
  this.propertiesService = PropertiesService;
  
  this.executionLog = tryParseJSON(this.propertiesService.getUserProperties().getProperty('CCPOTaskSchedulerClass_EXECUTION_LOG')) || [];
  this.statistics = tryParseJSON(this.propertiesService.getUserProperties().getProperty('CCPOTaskSchedulerClass_STATISTICS')) || { startTime: this.dateService.getDate() };
};

//CCPOTaskSchedulerClass prototype
CCPOTaskSchedulerClass.prototype = (function () {
  var start = function () {
    Logger.log('Starting scheduler execution');
        
    var readyTasks = getReadyTasks.call(this);
    
    Logger.log('Found ' + readyTasks.length + ' tasks ready to be executed');
    
    var errorInfo = null;
    if(readyTasks.length > 0) {
      var nextTask = getNextTask.call(this, readyTasks);
      
      Logger.log('Task ' + nextTask.id + ' is the next to be executed');
      
      var taskExecutionInfo = {
        executionStartTime: this.dateService.getDate().getTime(),
        taskId: nextTask.id
      };
      
      try {
        taskExecutionInfo.executionResult = executeTask.call(this, nextTask);
      } catch(e) {
        taskExecutionInfo.executionResult = 'FAIL';
        taskExecutionInfo.error = e.message || e;
        errorInfo = e;
      }
      
      taskExecutionInfo.executionEndTime = this.dateService.getDate().getTime();
      taskExecutionInfo.duration = taskExecutionInfo.executionEndTime - taskExecutionInfo.executionStartTime;
      
      Logger.log('Finished executing task ' + nextTask.id);
      Logger.log('Execution result: ' + taskExecutionInfo.executionResult);
      Logger.log('Execution duration: ' + taskExecutionInfo.duration + 'ms');
      
      if(taskExecutionInfo.executionResult == 'SUCCESS') {
        Logger.log('Removing old entries from the execution log');
        removeLogByTaskId(this.executionLog, nextTask.id);
      }
      this.executionLog.push(taskExecutionInfo);
      
      var stats = this.statistics[nextTask.id];
      if (!stats) {
        stats = {
          executionCount: 0,
          successfulExecutionCount: 0,
          failedExecutionCount: 0,
          totalExecutionTime: 0
        };
      }
      
      stats.totalExecutionTime += taskExecutionInfo.duration;
      stats.executionCount++;
      stats.averageExecutionTime = stats.totalExecutionTime / stats.executionCount;
      stats.lastExecutionTime = taskExecutionInfo.executionStartTime;
      if (taskExecutionInfo.executionResult == 'SUCCESS') { 
        stats.successfulExecutionCount++;
        stats.lastSuccessfulExecutionTime = taskExecutionInfo.executionStartTime;
      } else {
        stats.failedExecutionCount++;
      }
      this.statistics[nextTask.id] = stats;
    } else {
      Logger.log('No task ready to be executed.'); 
    }
    
    this.propertiesService.getUserProperties().setProperty('CCPOTaskSchedulerClass_EXECUTION_LOG', JSON.stringify(this.executionLog));
    this.propertiesService.getUserProperties().setProperty('CCPOTaskSchedulerClass_STATISTICS', JSON.stringify(this.statistics));
    
    Logger.log('Finished scheduler execution');
    if (errorInfo) {
      throw errorInfo;
    }
  };
  
  //filters the task list by checking whether or not they are ready to be executed
  var getReadyTasks = function () {
    Logger.log('Checking for ready tasks');
    var readyTasks = [];
    for(var i = 0; i < this.tasks.length; i++) {
      var task = this.tasks[i];
      Logger.log('Checking task ' + task.id);
      var ready = true;
      for(var j = 0; j < task.dependencies.length; j++) {
        var dependency = task.dependencies[j];
        Logger.log('Checking dependecy ' + dependency.type);
        switch(dependency.type) {
          case 'AFTER':
            var depTaskId = dependency.param1;
            var depLastRun = this.statistics[depTaskId] ? this.statistics[depTaskId].lastSuccessfulExecutionTime : 0;
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            
            if(!depLastRun || lastRun > depLastRun) {
              ready = false; 
              Logger.log('Task has already run after ' + depTaskId);
            } else {
              Logger.log('Task hasn\'t run after ' + depTaskId);
            }
            
            break;
          case 'BETWEEN_HOURS':
            var h1 = parseInt(dependency.param1.split(':')[0], 10), m1 = parseInt(dependency.param1.split(':')[1], 10);
            var h2 = parseInt(dependency.param2.split(':')[0], 10), m2 = parseInt(dependency.param2.split(':')[1], 10);
            var dt = this.dateService.getDate();
            var ch = dt.getHours(), cm = dt.getMinutes();
            
            var isBetween = false;
            if(h2 > h1 || (h2 === h1 && m2 >= m1)) {
              isBetween = (ch > h1 || (ch === h1 && cm >= m1)) && (h2 > ch || (h2 === ch && m2 >= cm));
            } else {
              isBetween = (ch > h1 || (ch === h1 && cm >= m1)) || (h2 > ch || (h2 === ch && m2 >= cm));
            }
            
            if(isBetween) {
              Logger.log('Current time (' + zeroPad(ch) + ':' + zeroPad(cm) + ') is between ' + zeroPad(h1) + ':' + zeroPad(m1) + ' and ' + zeroPad(h2) + ':' + zeroPad(m2));
            } else {
              Logger.log('Current time (' + zeroPad(ch) + ':' + zeroPad(cm) + ') is NOT between ' + zeroPad(h1) + ':' + zeroPad(m1) + ' and ' + zeroPad(h2) + ':' + zeroPad(m2));
              ready = false;
            }
            
            break;
          case 'CHECK_FILE':
            var file = dependency.param1;
            var parts = file.split('/');
            var exists = true;
            var folder = this.driveService.getRootFolder();
            for(var k = 0; k < parts.length - 1 && exists; k++) {
              if(parts[k] === '') { continue; }
              var folderIt = folder.getFoldersByName(parts[k]);
              if(folderIt.hasNext()) {
                folder = folderIt.next();
              } else {
                Logger.log('Folder ' + parts[k] + ' not found');
                exists = false; 
              }
            }
            if(exists) {
              var fileIt = folder.getFilesByName(parts[parts.length - 1]);
              if(!fileIt.hasNext()) {
                Logger.log('File ' + parts[parts.length - 1] + ' not found');
                exists = false;
              } else {
                Logger.log('File ' + file + ' found');
              }
            }
            if(!exists) {
              ready = false;
            }
            break;
          case 'EVERY_X_HOURS':
            var xHours = dependency.param1;
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              var now = this.dateService.getDate().getTime();
              if(now - lastRun < xHours * 3600000) {
                Logger.log('Task has already run in the last ' + xHours + ' hour(s)');
                ready = false; 
              } else {
                Logger.log('Task hasn\'t run in the last ' + xHours + ' hour(s)'); 
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          case 'ONCE_A_DAY':           
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              lastRun = new Date(lastRun);
              Logger.log('Task last run ' + lastRun);
              var now = this.dateService.getDate();
              if(lastRun.getDate() === now.getDate() && lastRun.getMonth() === now.getMonth() && lastRun.getFullYear() === now.getFullYear()) {
                Logger.log('Task has already run today');
                ready = false;
              } else {
                Logger.log('Task hasn\'t run today'); 
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          case 'ONCE_A_WEEK':
            var lastRun = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
            if(lastRun !== 0) {
              lastRun = new Date(lastRun);
              Logger.log('Task last run ' + lastRun);
              var now = this.dateService.getDate();
              if(getDateWeek(lastRun) === getDateWeek(now)) {
                Logger.log('Task has already run this week');
                ready = false;
              } else {
                Logger.log('Task hasn\'t run this week'); 
              }
            } else {
              Logger.log('Task has never run');
            }
            break;
          default:
            Logger.log('Dependency type not found');
            break;
        }                
      }
      if(ready) {
        Logger.log('Task ' + task.id + ' is ready');
        readyTasks.push(task);
      }
    }
    return readyTasks;
  };
  
  //identifies the next task to be executed
  var getNextTask = function (readyTasks) {
    Logger.log('Getting next task');
    var nextTask = null;
    var olderTime = 0;
    for(var i = 0; i < readyTasks.length; i++) {
      var task = readyTasks[i];
      Logger.log('Checking task ' + task.id);
      var lastExecutionTime = this.statistics[task.id] ? this.statistics[task.id].lastExecutionTime : 0;
      Logger.log('Last execution: ' + lastExecutionTime);
      if(nextTask === null || lastExecutionTime < olderTime) {
        nextTask = task;
        olderTime = lastExecutionTime;
      }
    }
    return nextTask;
  };
    
  //executes the task
  var executeTask = function (task) {
    Logger.log('Executing task ' + task.id);

    if(this.handlers[task.id]) { 
      this.handlers[task.id](); 
    } else { 
      throw new Error('No handler registered for task ' + task.id); 
    } 
    
    return 'SUCCESS';
  };
  
  //remove every entry in the array with taskId equals to the passed value
  var removeLogByTaskId = function (executionLog, taskId) {
    for(var i = executionLog.length - 1; i >= 0; i--) {
      if(executionLog[i].taskId === taskId) {
        executionLog.splice(i, 1);
      }
    }
  };
    
  var zeroPad = function (n) {
    return n < 10 ? '0' + n : n; 
  };
  
  var registerHandler = function(key, handler) { 
    this.handlers[key] = handler; 
  };
      
  //exposes the public methods
  return {
    start: start,
    registerHandler: registerHandler
  };
}) ();

//tries to parse a JSON, return null when it fails
var tryParseJSON = function (str) {
  try { return JSON.parse(str); }
  catch(ex) { return null; }
};

var tableToConfig = function (table, schedulerName) {
  var config = {
    schedulerName: schedulerName || 'CCPOTaskScheduler',
    tasks: []
  };
  
  var currentTask = null;
  for(var i = 0; i < table.length; i++) {
    if(!currentTask || currentTask.id !== table[i].ID) { 
      if(currentTask) { config.tasks.push(currentTask); }
      currentTask = {
        id: table[i].ID,
        description: table[i].Description,
        duration: table[i].Duration,
        dependencies: []
      }
    };
    
    var dep = { type: table[i].DependecyType };
    if(table[i].Param1) { dep.param1 = table[i].Param1; }
    if(table[i].Param2) { dep.param2 = table[i].Param2; }
    currentTask.dependencies.push(dep);
  }
  if(currentTask) { config.tasks.push(currentTask); }
    
  return config;
};
