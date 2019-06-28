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

let data = fs.readFileSync(options.peer_tls_cacerts); 
var peer = client.newPeer(options.peer_url, 
    { 
        pem: Buffer.from(data).toString(), 
        'ssl-target-name-override': options.server_hostname 
    } 
);

//接下来连接Orderer的时候也启用了TLS，也是同样的处理方法 
var odata = fs.readFileSync(options.orderer_tls_cacerts); 
var caroots = Buffer.from(odata).toString(); 
var orderer = client.newOrderer(options.orderer_url, { 
    'pem': caroots, 
    'ssl-target-name-override': "orderer.example.com" 
}); 

sdkUtils.newKeyValueStore({ 
    path: "/tmp/fabric-client-stateStore/" 
}).then((store) => { 
    client.setStateStore(store) 
    return client.createUser(createUserOpt) 
}) .then((user) => { 
    channel = client.newChannel(options.channel_id);  
    //因为启用了TLS，所以上面的代码就是指定Peer的TLS的CA证书 
    channel.addPeer(peer); 
    channel.addOrderer(orderer);
    targets.push(peer);
    //return ;
});


    
     

exports.invoke = function(req,res){
    console.log(req.query);
    var from = req.query['from'];
    var to = req.query['to'];
    var num = req.query['num'].toString();

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
    var proposal = {};
    var proposalResponses = [];
    channel.sendTransactionProposal(request).then((results) => { 
        proposalResponses = results[0]; 
        proposal = results[1]; 
        // var header = results[2]; 
        if (proposalResponses && proposalResponses[0].response && 
            proposalResponses[0].response.status === 200) { 
            // isProposalGood = true; 
            console.log(util.format('transaction proposal was good, Successfully sent Proposal and received ProposalResponse: metadata - %s', 
                proposalResponses[0].response.payload)); 
        } else { 
            console.error('transaction proposal was bad');
            res.set('Content-Type', 'text/html');
            res.send('transaction proposal was bad');
            throw new Error('transaction proposal was bad');
        }
        return ;
    }).then(() =>{
        var commit_request = {
            proposalResponses : proposalResponses,
            proposal : proposal,
            orderer: orderer
            //header : header
        };		
		const transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
		// create an array to hold on the asynchronous calls to be executed at the same time
		const promises = [];

		// this will send the proposal to the orderer during the execuction of
		// the promise 'all' call.
		const sendPromise = channel.sendTransaction(commit_request);
		//we want the send transaction first, so that we know where to check status
		promises.push(sendPromise);

		// get an event hub that is associated with our peer
        let event_hub = channel.newChannelEventHub(peer);
        res.set('Content-Type', 'text/html');
        res.send((proposalResponses[0].response.payload).toString());
		// create the asynchronous work item
		let txPromise = new Promise((resolve, reject) => {
			// setup a timeout of 30 seconds
			// if the transaction does not get committed within the timeout period,
			// report TIMEOUT as the status. This is an application timeout and is a
			// good idea to not let the listener run forever.
			let handle = setTimeout(() => {
				event_hub.unregisterTxEvent(transaction_id_string);
				event_hub.disconnect();
				resolve({event_status : 'TIMEOUT'});
			}, 30000);

			// this will register a listener with the event hub. THe included callbacks
			// will be called once transaction status is received by the event hub or
			// an error connection arises on the connection.
			event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
				// this first callback is for transaction event status
				// callback has been called, so we can stop the timer defined above
				clearTimeout(handle);
				// now let the application know what happened
				const return_status = {event_status : code, tx_id : transaction_id_string};
				if (code !== 'VALID') {
					console.error('The transaction was invalid, code = ' + code);
					resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
				} else {
					console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
					resolve(return_status);
				}
			}, (err) => {
				//this is the callback if something goes wrong with the event registration or processing
				reject(new Error('There was a problem with the eventhub ::'+err));
			},
				{disconnect: true} //disconnect when complete
			);

			// now that we have a protective timer running and the listener registered,
			// have the event hub instance connect with the peer's event service
			event_hub.connect();
			console.log('Registered transaction listener with the peer event service for transaction ID:'+ transaction_id_string);
		});
		// set the event work with the orderer work so they may be run at the same time
		promises.push(txPromise);
		// now execute both pieces of work and wait for both to complete
		console.log('Sending endorsed transaction to the orderer');
        return Promise.all(promises);
    }).then((results_promise)=>{
        // since we added the orderer work first, that will be the first result on
        // the list of results
        // success from the orderer only means that it has accepted the transaction
        // you must check the event status or the ledger to if the transaction was
        // committed
        if (results_promise[0].status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer');             
        } else {
            const message = util.format('Failed to order the transaction. Error code: %s', results_promise[0].status);
            console.error(message);
            throw new Error(message);
        }
        if (results_promise[1] instanceof Error) {
            console.error(message);
            throw new Error(message);
        } else if (results_promise[1].event_status === 'VALID') {
            console.log('Successfully committed the change to the ledger by the peer');
        } else {
            const message = util.format('Transaction failed to be committed to the ledger due to : %s', results_promise[1].event_status)
            console.error(message);
            throw new Error(message);
        }
    }).catch((err) => { 
        console.error("Caught Error", err);        
    });
}






