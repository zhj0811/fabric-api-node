var YAML = require('yamljs');
var hfc = require('fabric-client');
var path = require('path');
// var util = require('util');
// var co = require('co');
var fs = require('fs');
var sdkUtils = require('fabric-client/lib/utils');

class Config{
    constructor(){
        this.options = {};
        this.channel = {};
        this.client = new hfc();
        this.targets = [];     //peer节点
    }
}

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



Config.prototype.initSDKs= async function(configPath){
    this.options = YAML.load(configPath)
    console.log(this.options);
    var createUserOpt = {
        username : this.options.user.user_id,
        mspid : this.options.user.msp_id,
        cryptoContent : {
            privateKey : getKeyFilesInDir(this.options.user.privateKeyFolder)[0],
            signedCert : this.options.user.signedCert
        }
    };
    // var peersNum = options.peers.length;
    // console.log(options.peers[0]);
    var store = await sdkUtils.newKeyValueStore({
       path : '/tmp/fabric-client-stateStore'
    });
    this.client.setStateStore(store);
    let user = await this.client.createUser(createUserOpt);
    this.channel = await this.client.newChannel(this.options.channel.channel_id);
    await this.options.peers.forEach((v, i) =>{
        let data = fs.readFileSync(this.options.peers[i].tls_cacerts);
        let peer = this.client.newPeer(this.options.peers[i].host, {
            pem : Buffer.from(data).toString(),
            'ssl-target-name-override' : this.options.peers[i].hostname
        });
        // this.channel.addPeer(peer)
        this.targets.push(peer);
    });

    var odata = fs.readFileSync(this.options.orderer.tls_cacerts);
    var orderer = await this.client.newOrderer(this.options.orderer.host, {
        pem : Buffer.from(odata).toString(),
        'ssl-target-name-override' : this.options.orderer.hostname
    });

    this.channel.addOrderer(orderer);
}

config = new Config() 
// config.initSDKs('/home/zh/fabric-api-node/config/client_config.yaml')
module.exports = {
    config
}