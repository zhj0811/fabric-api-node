
var config = require('./config').config;
var sdk = require('./sdk');

var init = async function(pathName){
    await config.initSDKs(pathName);
    sdk.initRequest();
};

module.exports = (
    init 
)