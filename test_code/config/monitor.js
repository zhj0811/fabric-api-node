// var Config = require('./config').Config;
// config = new Config() 
var Config = require('./config');
var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var sdkUtils = require('fabric-client/lib/utils');
var fs = require('fs');
var YAML = require('yamljs');
var co = require('co');

var config = Config.config
co(function*(){  
    yield config.initSDKs('/home/zh/fabric-api-node/config/client_config.yaml')
    var options = config.options;
    var channel = config.channel;
    var client = config.client;
    var targets = config.targets;

  // console.log(config.client)
  var tx_id = null;
  tx_id = client.newTransactionID();
  console.log('Assigning transaction_id :', tx_id._transaction_id);
  var proposalRequest = {
      targets : targets,
      chaincodeId : options.channel.chaincode_id,
      fcn : 'invoke',
      args : ['a', 'b', '10'],
      chainId : options.channel.channel_id,
      txId : tx_id
  };
  let results = yield channel.sendTransactionProposal(proposalRequest);
  // console.log(results);

  var proposalResponses = results[0];
  var proposal = results[1];
  var header = results[2];
  var isProposalGood = false;
  if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
      isProposalGood = true;
      console.log('transaction proposal was good');
  } else {
      console.log('transaction proposal was bad');
  }

  if (isProposalGood) {
      console.log(util.format(
          'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s',
          proposalResponses[0].response.status,
          proposalResponses[0].response.message,
          proposalResponses[0].response.payload));

      var request = {
          proposalResponses: proposalResponses,
          proposal: proposal,
          header: header
      };


        var eventPromises = [];
        const sendPromise = channel.sendTransaction(request);
		//we want the send transaction first, so that we know where to check status
        eventPromises.push(sendPromise);

        const transaction_id_string = tx_id.getTransactionID();
        let event_hub = channel.newChannelEventHub(config.peer0);
        let txPromise = new Promise((resolve, reject) => {
            let handle = setTimeout(() => {
				event_hub.unregisterTxEvent(transaction_id_string);
				event_hub.disconnect();
				resolve({event_status : 'TIMEOUT'});
			}, 30000);
            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
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
        eventPromises.push(txPromise);

        try {
            console.log('Sending endorsed transaction to the orderer');
            const results = yield  Promise.all(eventPromises);
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
                // console.log('\n\n - try running "node query.js" to see the results');
            } else {
                const message = util.format('Transaction failed to be committed to the ledger due to : %s', results[1].event_status)
                console.error(message);
                throw new Error(message);
            }
            
            // res.send((proposalResponses[0].response.payload).toString());
        } catch(error) {
            console.log('Unable to invoke ::'+ error.toString());
        }
    }
})


