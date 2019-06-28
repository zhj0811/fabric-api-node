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
var targets = [];
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

var client = new hfc();
console.log('Setting up client side network objects');
var channel = client.newChannel(options.channel_id);
console.log('Created client side object to represent the channel');

sdkUtils.newKeyValueStore({ 
    path: "/tmp/fabric-client-stateStore/" 
}).then((store) => { 
    client.setStateStore(store) 
    return client.createUser(createUserOpt) 
}).then((user) => {    
});

// invoke();

//async function invoke() {
    async function invoke(req,res) {
	console.log('\n\n --- invoke.js - start');
	try {
        var peer = client.newPeer(options.peer_url); 
        channel.addPeer(peer);  
        targets.push(peer);
        var orderer = client.newOrderer(options.orderer_url); 
        console.log('Created client side object to represent the orderer');
        channel.addOrderer(orderer); 
		// get a transaction id object based on the current user assigned to fabric client
		// Transaction ID objects contain more then just a transaction ID, also includes
		// a nonce value and if built from the client's admin user.
		const tx_id = client.newTransactionID();
		console.log(util.format("\nCreated a transaction ID: %s", tx_id.getTransactionID()));

		// The fabcar chaincode is able to perform a few functions
		//   'createCar' - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom']
		//   'changeCarOwner' - requires 2 args , ex: args: ['CAR10', 'Dave']
        var proposal_request = { 
            targets: targets, 
            chaincodeId: options.chaincode_id, 
            fcn: 'invoke', 
            args: new Array('b', 'a', '10'), 
            chainId: options.channel_id, 
            txId: tx_id 
        };

		// notice the proposal_request has the peer defined in the 'targets' attribute

		// Send the transaction proposal to the endorsing peers.
		// The peers will run the function requested with the arguments supplied
		// based on the current state of the ledger. If the chaincode successfully
		// runs this simulation it will return a postive result in the endorsement.
		const endorsement_results = await channel.sendTransactionProposal(proposal_request);

		// The results will contain a few different items
		// first is the actual endorsements by the peers, these will be the responses
		//    from the peers. In our sammple there will only be one results since
		//    only sent the proposal to one peer.
		// second is the proposal that was sent to the peers to be endorsed. This will
		//    be needed later when the endorsements are sent to the orderer.
		const proposalResponses = endorsement_results[0];
		const proposal = endorsement_results[1];

		// check the results to decide if we should send the endorsment to be orderered
		if (proposalResponses[0] instanceof Error) {
			console.error('Failed to send Proposal. Received an error :: ' + proposalResponses[0].toString());
			throw proposalResponses[0];
		} else if (proposalResponses[0].response && proposalResponses[0].response.status === 200) {
			console.log(util.format(
				'Successfully sent Proposal and received response: Status - %s',
				proposalResponses[0].response.status));
		} else {
			const error_message = util.format('Invoke chaincode proposal:: %j', proposalResponses[i]);
			console.error(error_message);
			throw new Error(error_message);
		}

		// The proposal was good, now send to the orderer to have the transaction
		// committed.

		const commit_request = {
			orderer: orderer,
			proposalResponses: proposalResponses,
			proposal: proposal
		};

		//Get the transaction ID string to be used by the event processing
		const transaction_id_string = tx_id.getTransactionID();

		// create an array to hold on the asynchronous calls to be executed at the
		// same time
		const promises = [];

		// this will send the proposal to the orderer during the execuction of
		// the promise 'all' call.
		const sendPromise = channel.sendTransaction(commit_request);
		//we want the send transaction first, so that we know where to check status
		promises.push(sendPromise);

		// get an event hub that is associated with our peer
		let event_hub = channel.newChannelEventHub(peer);

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
		const results = await Promise.all(promises);

		// since we added the orderer work first, that will be the first result on
		// the list of results
		// success from the orderer only means that it has accepted the transaction
		// you must check the event status or the ledger to if the transaction was
		// committed
		if (results[0].status === 'SUCCESS') {
			console.log('Successfully sent transaction to the orderer');
		} else {
			const message = util.format('Failed to order the transaction. Error code: %s', results[0].status);
			console.error(message);
			throw new Error(message);
		}

		if (results[1] instanceof Error) {
			console.error(message);
			throw new Error(message);
		} else if (results[1].event_status === 'VALID') {
			console.log('Successfully committed the change to the ledger by the peer');
			console.log('\n\n - try running "node query.js" to see the results');
		} else {
			const message = util.format('Transaction failed to be committed to the ledger due to : %s', results[1].event_status)
			console.error(message);
			throw new Error(message);
        }
        
        res.send((proposalResponses[0].response.payload).toString());
	} catch(error) {
		console.log('Unable to invoke ::'+ error.toString());
	}
	console.log('\n\n --- invoke.js - end');
};

exports.invoke = invoke;