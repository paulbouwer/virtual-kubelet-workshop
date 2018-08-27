var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var os = require("os");
var morgan  = require('morgan');

// Set up express
var app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(morgan('combined'));

// Configuration and potential overrides
var port = process.env.PORT || 8080;
var mySQLHost = process.env.MYSQL_HOST;
var mySQLUser = process.env.MYSQL_USER;
var mySQLPassword = process.env.MYSQL_PASSWORD;
var mySQLDatabase = process.env.MYSQL_DATABASE || 'WorkItems';
var storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
var storageKey = process.env.AZURE_STORAGE_ACCESS_KEY;
var noOfWorkItems = process.env.NO_OF_WORKITEMS || 400;
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
function addQueueMessage(message) {
  queueService.createMessage(workitemQueue, message, function(error, results, response){
    if (error) throw error;
  });
}

// GET - display application ui
app.get('/', function (req, res) {

  writeLog('Rendering application.');

  res.render('app', {
    title: 'Virtual Kubelet burst scenario',
    noOfWorkItems: noOfWorkItems
  });
  
});

// GET - get workitem processing information
app.get('/workitems', function (req, res) {
  
  writeLog('/workitems - start');

  var sqlQuery = 'select (select count(*)/10.0 from ?? where CreateDateTime >= DATE_SUB(NOW(), INTERVAL 10 SECOND)) as ProcessingRate, count(*) as TotalProcessed from ??;';

  mysqlConnection.query(sqlQuery, [workitemTable, workitemTable], function (error, results, fields) {
    if (error) {
      writeLog(error);
      throw error;
    }

    var processingRate = 0;
    var totalProcessed = 0;    

    if (results.length > 0) {
      processingRate = results[0].ProcessingRate
      totalProcessed = results[0].TotalProcessed
    }
    
    writeLog('Total: ' + noOfWorkItems + ', Total Processed: ' + totalProcessed + ', Remaining: ' + (noOfWorkItems - totalProcessed) + ', ProcessingRate: ' + processingRate);

    res.json({ 
      total: noOfWorkItems,
      totalProcessed: totalProcessed,
      remaining: noOfWorkItems - totalProcessed, 
      processingRate: processingRate
    });

    writeLog('/workitems - end');
  });

});

// POST - reset workitems to starting state
app.post('/reset', function (req, res) {
  
  writeLog('/reset - start');

  // Remove all messages from the workitems queue
  queueService.clearMessages(workitemQueue, function(error, response) {
    if (error) {
      writeLog(error);
      throw error;
    }
    writeLog('Queue ' + workitemQueue + ' cleared.');
    
    // Remove all processing information from the workitems table
    var sqlQuery = 'truncate table ??;';
    mysqlConnection.query(sqlQuery, [workitemTable], function (error, results, fields) {
      if (error) {
        writeLog(error);
        throw error;
      }
      writeLog('Table ' + workitemTable + ' truncated.');

      for(var i = 1; i <= noOfWorkItems;i++){
        addQueueMessage("" + i);
      }
      writeLog(noOfWorkItems + ' messages added to the ' + workitemQueue + ' queue.');

      res.json({ 
        total: noOfWorkItems
      });

      writeLog('/reset - end');
    });
  });

});

// Set up listener
app.listen(port, function () {
  console.log("Listening on: http://%s:%s", os.hostname(), port);
});
