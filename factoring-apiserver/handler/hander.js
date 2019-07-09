"use strict"

const sdk = require('../sdk/sdk');
const Koa = require("koa");
const schema = require('./schema');
const utils = require('./utils');

const SaveData = "SaveData",
      QueryDataByFabricTxId = "QueryDataByFabricTxId",
      QueryDataByBusinessNo="QueryDataByBusinessNo"; 

async function savedata(ctx){
    var postBody = ctx.request.body;
    console.log(postBody);
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
        console.log("res:", res); 
        if (res instanceof Error){
            response.code = 702;
            response.msg = res;
            ctx.body = response;
            return; 
        }
        txids.push(res); 
    }
    response.code = 700;
    response.msg = txids;
    ctx.body = response;
    return;
}

async function query(ctx){
    let request = ctx.query;
    let response = {};
    let businessNo = request.businessNo,
        fabricTxId = request.fabricTxId;
    if (businessNo == "" && fabricTxId == "") {
        console.error("businessno and fabrictxid are all empty");
        response.code = 703;
        response.msg = "businessno and fabrictxid are all empty";
        ctx.body = response;
		return
	}
    var prams = [];
    var responseData
    if (fabricTxId != "") {
        // logger.Infof("query data with txid: %s", fabricTxId)
        console.log("query data with txid: ", fabricTxId);
        prams.push(fabricTxId);
		responseData = await sdk.query(QueryDataByFabricTxId, prams)
	} else if (businessNo != "") {
        prams.push(businessNo);
		// logger.Infof("query data with businessNO: %s", businessNo)
		responseData = await sdk.query(QueryDataByBusinessNo, prams)
	}
    // let res = await sdk.query("query", prams);
    // console.log("response: ", res);
    if (responseData instanceof Error){
        response.code = 704; 
        response.msg = responseData; 
        ctx.body = response;
        return
    }
    console.log("sdk.query response: ", responseData);
    let payload = await utils.FormatResponseMessage(responseData); 
    let responseMsg = [];
    for (let str of payload){
        let factor = await JSON.parse(str);
        responseMsg.push(factor);
    }
    response.code = 700;
    response.msg = responseMsg;
    // return ctx.body(res.toString())
    ctx.body = response;
    return;
}

module.exports={
    savedata,
    query
}