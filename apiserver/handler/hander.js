"use strict"

const sdk = require('../sdk/sdk');
const Koa = require("koa");

async function invoke(ctx){
    var postBody = ctx.request.body;
    console.log(postBody);
    console.log(typeof postBody);
    var prams = [];
    prams.push(postBody.from);
    prams.push(postBody.to);
    prams.push(postBody.num)
    let res = await sdk.invoke('invoke', prams);
    if (res instanceof Error){
        ctx.body = {
            err: res
        };
    }
    ctx.body = res;
    // ctx.body={       
    // }
}

async function query(ctx){
    var request = ctx.query;
    console.log(request.role);
    var prams = [];
    prams.push(request.role);
    let res = await sdk.query("query", prams);
    console.log("response: ", res);
    if (res instanceof Error){
        return ctx.body(res.toString());
    }
    // return ctx.body(res.toString())
    ctx.body = res.toString();
    return;
}

module.exports={
    invoke,
    query
}