#!/bin/bash

RESOURCE_GROUP=ContainerCampUK
LOCATION=WestEurope
NUMBER_ATTENDEES=25

# create resource group
az group create -n $RESOURCE_GROUP -l $LOCATION

# create storage account and queues
STORAGE_ACCOUNT_NAME=ccukworkshop$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 10 | head -n 1)
az storage account create -n $STORAGE_ACCOUNT_NAME -g $RESOURCE_GROUP -l $LOCATION --sku Standard_LRS --https-only true

STORAGE_ACCOUNT_KEY=$(az storage account keys list -n $STORAGE_ACCOUNT_NAME -g $RESOURCE_GROUP --query '[0].value' -o tsv)
for (( i=1; i<=$NUMBER_ATTENDEES; i++ ))
do
   az storage queue create --name workitems$i --account-key $STORAGE_ACCOUNT_KEY --account-name $STORAGE_ACCOUNT_NAME
done

# create mysql server and database
MYSQL_SERVER_NAME=ccukworkshop$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 10 | head -n 1)
MYSQL_SERVER_USERNAME=myadmin
MYSQL_SERVER_PASSWORD=$(cat /dev/urandom | tr -dc 'a-z0-9A-Z' | fold -w 16 | head -n 1)
MYSQL_DB_NAME=WorkItems
az mysql server create -n $MYSQL_SERVER_NAME -g $RESOURCE_GROUP -l $LOCATION --admin-user $MYSQL_SERVER_USERNAME --admin-password $MYSQL_SERVER_PASSWORD --sku-name GP_Gen5_8 --version 5.7
az mysql db create -n $MYSQL_DB_NAME -s $MYSQL_SERVER_NAME -g $RESOURCE_GROUP 
az mysql server firewall-rule create -n AllowAllIPs -s $MYSQL_SERVER_NAME -g $RESOURCE_GROUP --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255

# create tables in database
# ensure mysql client is available in this shell - apt-get install -y mysql-client
SQL_FILE=./create-tables.sql
echo "-- Create tables" > $SQL_FILE
for (( i=1; i<=$NUMBER_ATTENDEES; i++ ))
do
   echo "create table workitems$i (CreateDateTime DATETIME DEFAULT CURRENT_TIMESTAMP, Number VARCHAR(4) NOT NULL);" >> $SQL_FILE
done
curl -LO https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem
mysql -D $MYSQL_DB_NAME -h $MYSQL_SERVER_NAME.mysql.database.azure.com -u $MYSQL_SERVER_USERNAME@$MYSQL_SERVER_NAME -p$MYSQL_SERVER_PASSWORD --ssl-ca=./BaltimoreCyberTrustRoot.crt.pem < $SQL_FILE

# output
echo ""
echo "Storage Account details"
echo "-----------------------"
echo "Name: $STORAGE_ACCOUNT_NAME"
echo "Account Key: $STORAGE_ACCOUNT_KEY"
echo ""

echo "MySQL details"
echo "-------------"
echo ""
echo "Server: $MYSQL_SERVER_NAME"
echo "Username: $MYSQL_SERVER_USERNAME"
echo "Password: $MYSQL_SERVER_PASSWORD"
echo "Database Name: $MYSQL_DB_NAME"
