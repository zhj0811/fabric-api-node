const hfc = require('fabric-client');
const path = require('path');
const util = require('util');
const fs = require('fs'); 
const os = require('os');
var sdkUtils = require('fabric-client/lib/utils')

var options = { 
    user_id: 'Admin@org1.example.com', 
    msp_id:'Org1MSP', 
    channel_id: 'mychannel', 
    chaincode_id: 'mycc', 
    peer_url: 'grpc://localhost:7051',//因为启用了TLS，所以是grpcs,如果没有启用TLS，那么就是grpc 
    event_url: 'grpc://localhost:7053',//因为启用了TLS，所以是grpcs,如果没有启用TLS，那么就是grpc 
    orderer_url: 'grpc://localhost:7050',//因为启用了TLS，所以是grpcs,如果没有启用TLS，那么就是grpc 
    privateKeyFolder:'/home/zh/fabric1.1/deploy/e2ecli/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore', 
    signedCert:'/home/zh/fabric1.1/deploy/e2ecli/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem', 
    peer_tls_cacerts:'/home/zh/fabric1.1/deploy/e2ecli/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt', 
    orderer_tls_cacerts:'/home/zh/fabric1.1/deploy/e2ecli/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt', 
    server_hostname: "peer0.org1.example.com" 
};

const getKeyFilesInDir = (dir) => { 
    //该函数用于找到keystore目录下的私钥文件的路径 
    var files = fs.readdirSync(dir) 
    var keyFiles = [] 
    files.forEach((file_name) => { 
        let filePath = path.join(dir, file_name) 
        if (file_name.endsWith('_sk')) { 
            keyFiles.push(filePath) 
        } 
    }) 
    return keyFiles 
}

var createUserOpt = { 
    username: options.user_id, 
    mspid: options.msp_id, 
    cryptoContent: { privateKey: getKeyFilesInDir(options.privateKeyFolder)[0], signedCert: options.signedCert } 
} 

var targets = [];
var client = new hfc();
var peer={};
console.log('Setting up client side network objects');
var channel = client.newChannel(options.channel_id);
console.log('Created client side object to represent the channel');


Main()
async function Main(){
    await init();
}



async function init(){
    let store = await sdkUtils.newKeyValueStore({ 
        path: "/tmp/fabric-client-stateStore/" 
    });
    client.setStateStore(store) 
    await client.createUser(createUserOpt) 
    peer = client.newPeer(options.peer_url); 
    channel.addPeer(peer);  
    targets.push(peer);
    var orderer = client.newOrderer(options.orderer_url); 
    console.log('Created client side object to represent the orderer');
    channel.addOrderer(orderer); 
}

async function test(){
    let response = await channel.queryTransaction('899d722d24e2155b2114463b83af99a894ec4a645045986983fb40984c2ab589');
    console.log(response);
}

