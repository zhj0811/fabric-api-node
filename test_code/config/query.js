// var Config = require('./config').Config;
// config = new Config() 
var Config = require('./config');
var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var sdkUtils = require('fabric-client/lib/utils');
var fs = require('fs');
var YAML = require('yamljs');
var co = require('co');

co(function*(){
    var config = Config.config
    yield config.initSDKs('/home/zh/fabric-api-node/config/client_config.yaml')
    var options = config.options;
    var channel = config.channel;
    var client = config.client;
    var targets = config.targets;

    // console.log(config.client)
    var tx_id = null;
    tx_id = client.newTransactionID();
    console.log('Assigning transaction_id :', tx_id._transaction_id);
    const request = { 
        chaincodeId: options.channel.chaincode_id, 
        txId: tx_id, 
        fcn: 'query', 
        args: ['a'] 
    }; 
    let query_responses = yield channel.queryByChaincode(request); 
    console.log("returned from query: ", query_responses); 
    if (!query_responses.length) { 
        console.log("No payloads were returned from query"); 
    } else { 
        console.log("Query result count = ", query_responses.length)    //查询节点数
    } 
    if (query_responses[0] instanceof Error) { 
        console.error("error from query = ", query_responses[0]); 
    } 
    console.log("Response is ", query_responses[0].toString());//打印返回的结果 
})
