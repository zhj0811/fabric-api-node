const logger = require('../common/log4js').sdklogger;
const util = require('util');
const Config = require('./config');

async function HanldeBlockInfo(blockInfo){
    // console.log(JSON.stringify(blockInfo));
    let blockIndex = {
        blockNumber: blockInfo.header.number,
        txIndex: blockInfo.data.data.length
    };
    logger.info("block info ", blockIndex);
    let transactions = await FormatTransactions(blockInfo, blockIndex.txIndex);
    // console.log(transactions);
    HandleTransactions(transactions);
}

async function FormatTransactions(blockinfo, txIndex){
    let transactions = [];
    for (var i = 0; i < txIndex ; i++) {
        let transaction = {
            txid: blockinfo.data.data[i].payload.header.channel_header.tx_id,
            tx_validation_code: blockinfo.metadata.metadata[2][i],
            args: blockinfo.data.data[i].payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args,
            cc_name: blockinfo.data.data[i].payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.chaincode_id.name
        };
        transactions.push(transaction);
    }
    return transactions;    
}

async function HandleTransactions(transactions){
    for (let transaction of transactions){
        let txID = transaction.txid;
        if (transaction.tx_validation_code != 0 ){
            logger.error(util.format('The transaction %s was invalid, code = %d', txID, transaction.tx_validation_code));
            return;
        }
        let param = transaction.args[1]
        ParseArgs(txID, param.toString());
    }
}

async function ParseArgs(txID,parameters){
    console.log(txID);
    let input = JSON.parse(parameters);
    let request = input.value;
    let factor = JSON.parse(request);
    // logger.info("invoke args", request);
    logger.info(util.format("savedata success businessNo: %s with txid %s and request %s", factor.businessNo, txID, request));
}

module.exports = {
    HanldeBlockInfo
}