var os = require("os");

var mySQLHost = process.env.MYSQL_HOST;
var mySQLUser = process.env.MYSQL_USER;
var mySQLPassword = process.env.MYSQL_PASSWORD;
var mySQLDatabase = process.env.MYSQL_DATABASE || 'WorkItems';
var storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
var storageKey = process.env.AZURE_STORAGE_ACCESS_KEY;
var computeTimeInSeconds = process.env.COMPUTE_TIME_IN_SECONDS || 1;
var workitemQueue = process.env.WORKITEM_QUEUE;
var workitemTable = process.env.WORKITEM_TABLE;

// Set up mySQL connection
var mysql = require('mysql2');
var config =
{
  host      : mySQLHost,
  user      : mySQLUser,
  password  : mySQLPassword,
  database  : mySQLDatabase,
  port      : 3306,
  ssl       : true
};
var mysqlConnection = mysql.createConnection(config);

// Set up Azure Storage connection
var azureStorage = require('azure-storage');
var queueService = azureStorage.createQueueService(storageAccount, storageKey);

function writeLog(message) {

  var now = new Date();
  var formattedDate = now.toISOString();
  console.log('[' + formattedDate + '] ' + message);
}

// Process every computeTimeInSeconds seconds
setInterval(() => {

  writeLog('Processing - start');

  queueService.getMessages(workitemQueue, function(error, results, response) {
    if (error) {
      writeLog(error);
      throw error;
    }
    var message = results[0];
    writeLog('Retrieved message ' + message.messageText + ' from queue ' + workitemQueue);

    queueService.deleteMessage(workitemQueue, message.messageId, message.popReceipt, function(error, response) {
      if (error) {
        writeLog(error);
        throw error;
      }
      writeLog('Deleted message ' + message.messageText + ' from queue ' + workitemQueue);

      var sqlQuery = 'insert into ?? (Number) values (?);';
      mysqlConnection.query(sqlQuery, [workitemTable, message.messageText], function (error, results, fields) {
        if (error) {
          writeLog(error);
          throw error;
        }
        writeLog('Wrote processed entry ' + message.messageText + ' into table ' + workitemTable);
        writeLog('Processing - end');
      });
    });

  });

}, computeTimeInSeconds * 1000); 
