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
    var proposalRequest = {
        targets : targets,
        chaincodeId : options.channel.chaincode_id,
        fcn : 'invoke',
        args : ['a', 'b', '10'],
        chainId : options.channel.channel_id,
        txId : tx_id
    };
    let results = yield channel.sendTransactionProposal(proposalRequest);
    // console.log(results);

    var proposalResponses = results[0];
    var proposal = results[1];
    var header = results[2];
    var isProposalGood = false;
    if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
        isProposalGood = true;
        console.log('transaction proposal was good');
    } else {
        console.log('transaction proposal was bad');
    }

    if (isProposalGood) {
        console.log(util.format(
            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s',
            proposalResponses[0].response.status,
            proposalResponses[0].response.message,
            proposalResponses[0].response.payload));

        var request = {
            proposalResponses: proposalResponses,
            proposal: proposal,
            header: header
        };
        let res = yield channel.sendTransaction(request);
        console.log(res);
    }
})





// Promise.resolve().then(function() {
//     tx_id = client.newTransactionID();
//     console.log('Assigning transaction_id :', tx_id._transaction_id);
//     var request = {
//         targets : targets,
//         chaincodeId : options.chaincode_id,
//         fcn : 'invoke',
//         args : ['a', 'b', '10'],
//         chainId : options.channel_id,
//         txId : tx_id
//     };

//     return channel.sendTransactionProposal(request);
// }).then(function(results) {
//     var proposalResponses = results[0];
//     var proposal = results[1];
//     var header = results[2];
//     var isProposalGood = false;
//     if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
//         isProposalGood = true;
//         console.log('transaction proposal was good');
//     } else {
//         console.log('transaction proposal was bad');
//     }

//     if (isProposalGood) {
//         console.log(util.format(
//             'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s, endorsement signature: %s',
//             proposalResponses[0].response.status,
//             proposalResponses[0].response.message,
//             proposalResponses[0].response.payload,
//             proposalResponses[0].endorsement.signature));

//         var request = {
//             proposalResponses : proposalResponses,
//             proposal : proposal,
//             header : header
//         };

//         var transactionID = tx_id.getTransactionID();
//         var eventPromises = [];
//         // var eh = client.newEventHub();
//         var eh = channel.newChannelEventHub('localhost:7051');
//         var data = fs.readFileSync(options.peer_tls_cacerts);
//         var grpcOpts = {
//             pem : Buffer.from(data).toString(),
//             'ssl-target-name-override' : options.server_hostname
//         };
        
//         // eh.setPeerAddr(options.event_url, grpcOpts);
//         eh.connect();

//         var txPromise = new Promise(function(resolve, reject) {
//             var handle = setTimeout(function() {
//                 eh.disconnect();
//                 reject();
//             }, 30000);

//             eh.registerTxEvent(transactionID, function(tx, code) {
//                 clearTimeout(handle);
//                 eh.unregisterTxEvent(transactionID);
//                 eh.disconnect();

//                 if (code !== 'VALID') {
//                     console.error('The transaction was invalid, code = ' + code);
//                     reject();
//                 } else {
//                     console.log('The transaction has been commited on peer ' + eh.getPeerAddr());
//                     resolve();
//                 }   
//             });
//         });
        
//         eventPromises.push(txPromise);
//         var sendPromise = channel.sendTransaction(request);
//         return Promise.all([sendPromise].concat(eventPromises)).then(function(results) {
//             console.log('event promise all complete and testing complete');
//             return results[0];
//         }).catch(function(err) {
//             console.error('Failed to send transaction and get notifications within the timeout period.');
//             return 'Failed to send transaction and get notifications within the timeout period.';
//         });
//     } else {
//         console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
//         return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...';
//     }
// }, function(err) {
//     console.error('Failed to send proposal due to error :' + err.stack? err.stack : err);
//     return 'Failed to send proposal due to error :' + err.stack? err.stack : err;
// }).then(function(response) {
//     if (response.status === 'SUCCESS') {
//         console.log('Successfully sent transaction to the orderer.');
//         return tx_id.getTransactionID();
//     } else {
//         console.error('Failed to order the transaction. Error code:' + response.status);
//         return 'Failed to order the transaction. Error code:' + response.status;
//     }
// }, function(err) {
//     console.error('Failed to send transaction due to error:' + err.stack? err.stack : err);
//     return 'Failed to send transaction due to error : '+ err.stack? err.stack : err;
// });