
var Config = require('./config');
var util = require('util');

var config = {};
var proposalRequest = {};
var queryRequest = {};

function initRequest() {
    config = Config.config;
    proposalRequest.targets = config.targets;
    proposalRequest.chaincodeId = config.options.channel.chaincode_id;
    proposalRequest.chainId = config.options.channel.channel_id;

    queryRequest.chaincodeId = config.options.channel.chaincode_id
}
async function invoke(invokeFunction, parameters) {
    var proposalRequest = {
        targets : config.targets,
        chaincodeId : config.options.channel.chaincode_id,
        chainId : config.options.channel.channel_id
    };

    let tx_id = null;
    tx_id = config.client.newTransactionID();
    console.log('Assigning transaction_id :', tx_id._transaction_id);

    proposalRequest.fcn = invokeFunction;
    proposalRequest.args = parameters;
    proposalRequest.txId = tx_id;

    let results = await config.channel.sendTransactionProposal(proposalRequest);
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
        return new Error('transaction proposal was bad');
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
        let res = await config.channel.sendTransaction(request);
        if (res.status != "SUCCESS"){
            return new Error(res);
        }
        return tx_id.getTransactionID();
    }
}

async function query(queryFunction, parameters){

    console.log("params :", parameters);
    var tx_id = null;
    tx_id = config.client.newTransactionID();
    console.log('Assigning transaction_id :', tx_id._transaction_id);

    queryRequest.txId = tx_id;
    queryRequest.fcn = queryFunction;
    queryRequest.args = parameters;

    // console.log(typeof queryRequest);
    let query_responses = await config.channel.queryByChaincode(queryRequest); 
    console.log("returned from query: ", query_responses); 
    if (!query_responses.length) { 
        console.log("No payloads were returned from query"); 
        return new Error("No payloads were returned from query")
    } else { 
        console.log("Query result count = ", query_responses.length)
    } 
    if (query_responses[0] instanceof Error) { 
        console.error("error from query = ", query_responses[0]); 
        return new Error("error from query = ", query_responses[0])
    } 
    console.log("Response is ", query_responses[0].toString());
    return query_responses[0];
}

module.exports = {
    invoke,
    query,
    initRequest
}