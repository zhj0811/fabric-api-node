var YAML = require('yamljs');
var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var co = require('co');
var fs = require('fs');
var sdkUtils = require('fabric-client/lib/utils');

var getKeyFilesInDir = function(dir) {
    var files = fs.readdirSync(dir);
    var keyFiles = [];
    files.forEach(function(file_name) {
        var filePath = path.join(dir, file_name);
        if (file_name.endsWith('_sk')) {
            keyFiles.push(filePath);
        }
    });

    return keyFiles;
};

class Config{
     constructor(){
         this.options = {};
         this.channel = {};
         this.client = new hfc();
         this.targets = [];     //peer节点
     }
}
Config.prototype.initSDKs= async function(configPath){
    this.options = YAML.load(configPath);
    console.log('Load privateKey and signedCert');
   //  await co(function*(){
   var createUserOpt = {
       username : this.options.user_id,
       mspid : this.options.msp_id,
       cryptoContent : {
           privateKey : await getKeyFilesInDir(this.options.privateKeyFolder)[0],
           signedCert : this.options.signedCert
       }
   };

   // await co(function*(){
    var store = await sdkUtils.newKeyValueStore({
        path : '/tmp/fabric-client-stateStore'
    });
    this.client.setStateStore(store);
    let user = await this.client.createUser(createUserOpt);
   // }) 

   this.channel = await this.client.newChannel(this.options.channel_id);
   var data = fs.readFileSync(this.options.peer_tls_cacerts);
   var peer = await this.client.newPeer(this.options.peer_url, {
       pem : Buffer.from(data).toString(),
       'ssl-target-name-override' : this.options.server_hostname
   });

   this.channel.addPeer(peer);
   var odata = fs.readFileSync(this.options.orderer_tls_cacerts);
   var caroots = Buffer.from(odata).toString();
   var orderer = await this.client.newOrderer(this.options.orderer_url, {
       pem : caroots,
       'ssl-target-name-override' : 'orderer.example.com'
   });

   this.channel.addOrderer(orderer);
   this.targets.push(peer);
}
config = new Config() 

// exports = module.exports = {
 module.exports = {
     config
}

// exports.config = config