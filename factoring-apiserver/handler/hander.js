"use strict"

const sdk = require('../sdk/sdk');
const Koa = require("koa");
const schema = require('./schema');
const utils = require('./utils');
const logger = require('../common/log4js').handlelogger;

const SaveData = "SaveData",
      QueryDataByFabricTxId = "QueryDataByFabricTxId",
      QueryDataByBusinessNo="QueryDataByBusinessNo"; 

async function savedata(ctx){
    logger.debug("enter savedata function ...")
    var postBody = ctx.request.body;
    // console.log(postBody);
    logger.info("request body: ", postBody);
    let schemaRes = schema.SchemaValidator(postBody);
    let response = {};
    if (schemaRes.error != null){
        response.code = 701;
        response.msg = schemaRes;
        ctx.body = response;
        return;
    }
    let factorList = schemaRes.value;
    let txids = [];
    // await factorList.forEach(async factor => {
    //     let postStr = utils.FormatRequestMessage(factor);
    //     let prams = [];
    //     prams.push(postStr);
    //     let res = await sdk.invoke(SaveData, prams);  
    //     console.log("res:", res); 
    //     if (res instanceof Error){
    //         response.code = 702;
    //         response.msg = res;
    //         ctx.body = response;
    //         return; 
    //     }
    //     txids.push(res);
    // });
    for (let factor of factorList){
        let postStr = utils.FormatRequestMessage(factor);
        let prams = [];
        prams.push(postStr);
        let res = await sdk.invoke(SaveData, prams);  
        if (res instanceof Error){
            response.code = 702;
            response.msg = res;
            ctx.body = response;
            return; 
        }
        logger.info("sdk.invoke response: ", res)
        txids.push(res); 
    }
    response.code = 700;
    response.msg = txids;
    ctx.body = response;
    return;
}

async function query(ctx){
    logger.debug("enter query function ...")
    let request = ctx.query;
    let response = {};
    let businessNo = request.businessNo,
        fabricTxId = request.fabricTxId;
    if ((businessNo == "" || businessNo == undefined )&& (fabricTxId == "" || fabricTxId == undefined)) {
        // console.error("businessno and fabrictxid are all empty");
        logger.error("businessno and fabrictxid are all empty");
        response.code = 703;
        response.msg = "businessno and fabrictxid are all empty";
        ctx.body = response;
		return
	}
    let prams = [];
    let responseData
    if (fabricTxId != "" && fabricTxId != undefined) {
        logger.info("query data with txid: ", fabricTxId)
        prams.push(fabricTxId);
		responseData = await sdk.query(QueryDataByFabricTxId, prams)
	} else if (businessNo != "") {
        logger.info("query data with businessNO: ", businessNo);
        prams.push(businessNo);
		responseData = await sdk.query(QueryDataByBusinessNo, prams)
	}
    logger.info("sdk.query result: ", responseData.toString());
    // console.log("response: ", res);
    if (responseData instanceof Error){
        response.code = 704; 
        response.msg = responseData; 
        ctx.body = response;
        return
    }
    // console.log("sdk.query response: ", responseData);
    let payload = await utils.FormatResponseMessage(responseData); 
    let responseMsg = [];
    if (payload[0] == ""){
        logger.info("query result is null")
        response.code = 700;
        response.msg = "query result is null";
        // return ctx.body(res.toString())
        ctx.body = response;
        return;   
    }
    // logger.info(payload);
    for (let str of payload){
        let factor = await JSON.parse(str); //str == "" 会报错
        responseMsg.push(factor);
    }
    response.code = 700;
    response.msg = responseMsg;
    ctx.body = response;
    return;
}

module.exports={
    savedata,
    query
}