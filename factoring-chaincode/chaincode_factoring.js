/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const shim = require('fabric-shim');
const util = require('util');
const schema = require('./schema');

var logger = shim.newLogger("factorcc");
const KEEPALIVETEST = "test"


var Chaincode = class {
  // Initialize the chaincode
  async Init(stub) {
    logger.info('========= Init factoring =========');
    let ret = stub.getFunctionAndParameters();

    try {
      await stub.putState(KEEPALIVETEST, Buffer.from(KEEPALIVETEST));
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    logger.info(JSON.stringify(ret));
    // logger.info(this);
    var that = this;
    let method = this[ret.fcn];
    if (!method) {
      logger.error('no method of name:' + ret.fcn + ' found');
      return shim.error("the function name not exist!!");
    } 
    try {
      let payload = await method(stub, ret.params, that);
      return shim.success(payload);
    } catch (err) {
      logger.error(err);
      return shim.error(err);
    }
  }


  async SaveData(stub, args) {
    let reqStr = args[0];
    let request = JSON.parse(reqStr);
    let data = JSON.parse(request.value);
    // logger.info(JSON.stringify(data));
    let schemaRes = schema.SchemaValidator(data);
    // logger.info(typeof schemaRes);
    if (schemaRes.error != null){
      throw new Error(schemaRes.error)
    }
    let factor = schemaRes.value;
    let txid = stub.getTxID();
    factor.fabricTxId = txid;
    let factorStr = JSON.stringify(factor);

    try {
      await stub.putState(txid, Buffer.from(factorStr));
      try{
        await stub.putState(factor.businessNo, Buffer.from(txid));
        return 
      }catch (err) {
        throw new Error(err);
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async QueryDataByFabricTxId(stub, args) {
    let txData = await stub.getState(args[0]);
    if (!txData) {
      throw new Error(util.format('Failed to get state of by fabricTxId %s', args[0]));
    }
    let payload = [];
    payload.push(txData.toString());
    let response = {
      payload: payload
    }
    return Buffer.from(JSON.stringify(response));
  }

  async QueryDataByBusinessNo(stub, args, that) {
    let fabricTxId = await stub.getState(args[0]);
    if (!fabricTxId) {
      throw new Error(util.format('Failed to get fabricTxId of by businessNo %s', args[0]));
    }
    let params = [];
    params.push(fabricTxId.toString());
   
    // let payload = 
    return await that.QueryDataByFabricTxId(stub, params);
  }

  async KeepaliveQuery(stub, args) {
    let data = await stub.getState(KEEPALIVETEST);
    if (!data){
      throw new Error("ERROR! KeepaliveQuery get failed");
    }
    if (data.toString() != KEEPALIVETEST){
      throw new Error(util.format("ERROR! KeepaliveQuery get result is %s", data.toString()));
    }
    return Buffer.from("Reached")
  }
};

shim.start(new Chaincode());