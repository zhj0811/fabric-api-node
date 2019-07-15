'use strict';

var hfc = require('fabric-client'); 
var path = require('path'); 
var util = require('util'); 
var sdkUtils = require('fabric-client/lib/utils') 
const fs = require('fs'); 
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

var channel = {}; 
var targets = []; 
var tx_id = null; 
var client = new hfc(); 

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

sdkUtils.newKeyValueStore({ 
    path: "/tmp/fabric-client-stateStore/" 
}).then((store) => { 
    client.setStateStore(store) 
    return client.createUser(createUserOpt) 
}) .then((user) => { 
    channel = client.newChannel(options.channel_id); 
    let data = fs.readFileSync(options.peer_tls_cacerts); 
    let peer = client.newPeer(options.peer_url, 
        { 
            pem: Buffer.from(data).toString(), 
            'ssl-target-name-override': options.server_hostname 
        } 
    ); 
    //因为启用了TLS，所以上面的代码就是指定Peer的TLS的CA证书 
    channel.addPeer(peer); 
    //接下来连接Orderer的时候也启用了TLS，也是同样的处理方法 
    let odata = fs.readFileSync(options.orderer_tls_cacerts); 
    let caroots = Buffer.from(odata).toString(); 
    var orderer = client.newOrderer(options.orderer_url, { 
        'pem': caroots, 
        'ssl-target-name-override': "orderer.example.com" 
    }); 
    
    channel.addOrderer(orderer); 
    targets.push(peer);
    //return ;
});

exports.invoke = function(req,res){
    console.log(req.query);
    var from = req.query['from'];
    var to = req.query['to'];
    var num = req.query['num'].toString();
    console.log("Make query"); 
    tx_id = client.newTransactionID(); 
    console.log("Assigning transaction_id: ", tx_id._transaction_id); 
    //发起转账行为，将a->b 10元 
    var request = { 
        targets: targets, 
        chaincodeId: options.chaincode_id, 
        fcn: 'invoke', 
        args: new Array(from, to, num), 
        chainId: options.channel_id, 
        txId: tx_id 
    }; 
    console.log(request);
    channel.sendTransactionProposal(request).then((results) => { 
        var proposalResponses = results[0]; 
        var proposal = results[1]; 
        var header = results[2]; 
        let isProposalGood = false; 
        if (proposalResponses && proposalResponses[0].response && 
            proposalResponses[0].response.status === 200) { 
            isProposalGood = true; 
            console.log('transaction proposal was good'); 
        } else { 
            console.error('transaction proposal was bad'); 
            throw new Error(error_message);
        } 
        
        if (isProposalGood){
            console.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s, endorsement signature: %s',
                proposalResponses[0].response.status,
                proposalResponses[0].response.message,
                proposalResponses[0].response.payload,
                proposalResponses[0].endorsement.signature));
            var request = {
                proposalResponses : proposalResponses,
                proposal : proposal,
                header : header
            };
        }
        channel.sendTransaction(request);
        res.set('Content-Type', 'text/html');
        res.send((proposalResponses[0].response.payload).toString());
    }).catch((err) => { 
        console.error("Caught Error", err); 
    });
}






