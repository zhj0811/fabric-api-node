const logger = require('../common/log4js').sdklogger;
const util = require('util');
const Config = require('./config');

async function HanldeBlockInfo(blockInfo){
    console.log(JSON.stringify(blockInfo));
    let blockIndex = {
        blockNumber: blockInfo.number,
        txIndex: blockInfo.filtered_transactions.length
    };
    logger.info("block info ", blockIndex);
    await HandleTransactions(blockInfo.filtered_transactions);
}

async function HandleTransactions(transactions){
    for (let transaction of transactions){
        let txID = transaction.txid;
        if (transaction.tx_validation_code != 'VALID'){
            logger.error(util.format('The transaction %s was invalid, code = %s', txID, transaction.tx_validation_code));
            return;
        }
        // let input = transaction.transaction_actions.chaincode_actions;
        // console.log(input);
        // console.log(input.length);
        // logger.info(JSON.stringify(input));    
        let txResponse = await Config.config.channel.queryTransaction(txID); 
        let args = txResponse.transactionEnvelope.payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args[1];
        // console.log("tx", tx);
        // logger.info(JSON.stringify(args));
        ParseArgs(txID, args.toString());
    }
}

async function ParseArgs(txID,args){
    let input = JSON.parse(args);
    let request = input.value;
    let factor = JSON.parse(request);
    // logger.info("invoke args", request);
    logger.info(util.format("savedata success businessNo: %s with txid %s and request %s", factor.businessNo, txID, request));
}

module.exports = {
    HanldeBlockInfo
}