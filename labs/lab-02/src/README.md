# Components

## Application

config:

    AZURE_STORAGE_ACCOUNT: 
    AZURE_STORAGE_ACCESS_KEY:
    AZURE_STORAGE_QUEUE_NAME:
    AZURE_MYSQL_HOST:
    AZURE_MYSQL_PASSWORD:
    NO_OF_WORKITEMS:

/

> render app
> call /workitems every 1s

/reset

> clear all messages from user's queue in Storage Queue
> clearMessages(queue [, options], callback)
> http://azure.github.io/azure-storage-node/QueueService.html#clearMessages__anchor

> delete the rows from user's table in MySQL DB
> truncate table 
> https://dev.mysql.com/doc/refman/8.0/en/truncate-table.html

> insert NO_OF_WORKITEMS messages into user's queue

/workitems

> Get remaining work items to process - NO_OF_WORKITEMS subtract select count() from myql table
> Get work item processing rate - select count() from mysql table where time >= datediff(last 1 sec)
> Render as json (workItems: { total:, remaining:, processingRate: })
> insert into workitem1 (Number) values ('32'); 
> select count(*) from workitem1 where CreateDateTime >= DATE_SUB(NOW(), INTERVAL 6 SECOND);
> truncate table workitem1;

## Worker

config:

    AZURE_STORAGE_ACCOUNT:
    AZURE_STORAGE_ACCESS_KEY:
    AZURE_STORAGE_QUEUE_NAME:
    AZURE_MYSQL_HOST:
    AZURE_MYSQL_PASSWORD:
    COMPUTE_TIME:

> Grab a message from queue (getMessages)
> Wait COMPUTE_TIME
> Delete message from queue (deleteMessage)
> Write record to database (insert)
> Log each action

## Azure Storage Queue

- https://docs.microsoft.com/en-us/azure/storage/queues/storage-nodejs-how-to-use-queues
- http://azure.github.io/azure-storage-node/QueueService.html

Message: Number

Create Storage Account
https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-create

Create Storage Queues
https://docs.microsoft.com/en-us/cli/azure/storage/queue?view=azure-cli-latest#az-storage-queue-create


## MySQL

- https://docs.microsoft.com/en-us/azure/mysql/connect-nodejs
- https://docs.microsoft.com/en-us/azure/mysql/quickstart-create-mysql-server-database-using-azure-cli
- https://docs.microsoft.com/en-us/javascript/api/overview/azure/mysql?view=azure-node-latest

Table - CreateDateTime, Number

Create MySQL Server
https://docs.microsoft.com/en-us/cli/azure/mysql/server?view=azure-cli-latest#az-mysql-server-create

Create MySQL Database
https://docs.microsoft.com/en-us/cli/azure/mysql/db?view=azure-cli-latest#az-mysql-db-create
