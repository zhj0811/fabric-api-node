

function FormatRequestMessage(factor){
    let request = {
        key: factor.fabricTxId,
        value: JSON.stringify(factor)
    };

    return JSON.stringify(request);
}

async function FormatResponseMessage(response){
    let queryResponse = response.toString();
    // console.log("query response json:", queryResponse)
    let responseJson = await JSON.parse(queryResponse);
    // let payloadStr = responseJson.payload;
    // console.log(typeof payloadStr);
    // let payload = await JSON.parse(payloadStr)
    return responseJson.payload;
}

module.exports = {
    FormatRequestMessage,
    FormatResponseMessage
}