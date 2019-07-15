"use strict";

const path = require('path');
// const init = require('./sdk/init');
// const log = require('./common/log4js');
const sdk = require('./sdk/sdk');
const Config = require('./sdk/config');


main();
// co(function*(){
async function main(){
      await Config.config.initSDKs(path.join(__dirname, './sdk/client_config.yaml'))
      var eventHub = Config.config.eventHub;
      eventHub.connect();      
      eventHub.registerBlockEvent((blockInfo)=>{
            // console.log(blockInfo);
            sdk.HanldeBlockInfo(blockInfo);
        },
        (err)=>{console.log(err);},
        {disconnect: true}
      );
}

