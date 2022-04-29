//Helpers:
//Set property:
//request('http://localhost:16208/gateway/2.0/publish?Type=Set&Target=Store&Name=State.CSGOMAJOR.Teams.Team1.Player0.HLTVR&Value="1"', function (error, response, body){
//});

//Get property:
//request('http://localhost:16208/gateway/2.0/publish?Type=Get&Target=Store&Name=State.CSGOMAJOR.Teams.Team1.Player0.HLTVR', function (error, response, body){
    //console.log(JSON.parse(body)[0]["Message"]["Value"]);
//});

//Call function:
//request('http://localhost:16208/gateway/2.0.0/publish?Type=Call&Target=~LOCAL~-Engine&Method=CallFunction&ParamObjectSearch=BP_ViaCallFunctionWithActor_2&ParamFunctionName=Example4Function&ParamFunctionArguments=[2]')


//http://localhost:16208/gateway/2.0.0/publish?Type=Call&Target=~LOCAL~-Engine&Method=CallFunction&ParamObjectSearch=BP_ViaCallFunctionWithActor_2&ParamFunctionName=Example4Function&ParamFunctionArguments=[2,%20{%22Value%22:%22TEST%22},%2010]

// var payload2 = {
//     "Topic": {"Type":"Call","Target":"~LOCAL~-Engine","Method":"CallFunction"},
//     "Message": {"Params":{"ObjectSearch":"BP_TESTBP", "FunctionName": "PrintResult", "FunctionArguments": [JSON.stringify({"Player0": "S1mple", "Player1": "Miracle"}), 12, 13]}}
// };

// setInterval(function(){
//     request.post({
//         url: url,
//         body: payload3,
//         json: true}, (error, response, body) =>
//         {
//             console.log(body[0]);
//         });
// }, 1000);

// var teams = {
//     "team0": "fnatic",
//     "team1": "virtus pro",
//     "team2": "mouz",
//     "team3": "heroic"
// };

// var payload3 = {
//     "Topic": {"Type":"Set","Target":"Store","Name":"State.Bazi.CSGO.Teams"},
//     "Message": {"Value": teams}
// }

var request = require('request');
var baseUrl = 'http://localhost:16208/gateway/2.2.0/publish';
var gateways = ["10.97.3.15", "10.97.3.16", "10.97.3.17"]; //probably need just one gateway, the one set as server?

//Aici salvam motoarele online:
var engines = [];

//Helper functions:

//These functions are useful for performing get requests:
// function topicToUrl(topic){
//     var urlTail = "?";
//     for (const [key, value] of Object.entries(topic)){
//         urlTail += key + "=" + value + "&";
//     }
//     return baseUrl + urlTail.slice(0, -1);
// }

// function zmqFrameToUrl(topic, message){
//     var urlTail = "?";
//     for (const [key, value] of Object.entries(topic)){
//         urlTail += key + "=" + value + "&";
//     }
//     for (const [key, value] of Object.entries(message["Params"])){
//         urlTail += "Param" + key + "=" + value + "&";
//     }
//     return baseUrl + urlTail.slice(0, -1);
// }
//End of region

function buildStoreGetTopic(name){
    var topic = {Type: "Get", Target: "Store", Name: name};
    //return JSON.stringify(topic);
    return topic;
}

function buildStoreSetTopic(name){
    var topic = {Type: "Set", Target: "Store", Name: name};
    return JSON.stringify(topic);
}

function buildCallFunctionTopic(targetEngine){
    var topic = {Type: "Call", Target: targetEngine, Method: "CallFunction"};
    return topic;
}

function buildCallFunctionMessage(objectName, functionName, functionArgumentsArray){
    var message = {Params:{ObjectSearch:objectName, FunctionName: functionName, FunctionArguments: functionArgumentsArray}};
    return message;
}

function buildCallFunctionPayload(targetEngine, objectName, functionName, functionArgumentsArray){
    let topic = buildCallFunctionTopic(targetEngine);
    let message = buildCallFunctionMessage(objectName, functionName, functionArgumentsArray);
    return {Topic: topic, Message: message};
}

function buildPayload(topic, message){
    return {Topic: topic, Message: message};
}

// function getOnlineEnginesGetRequest(){
//     var url = baseUrl + topicToUrl(buildStoreGetTopic("ConnectedClients"));
//     var topic = buildStoreGetTopic("ConnectedClients");
//     var message = {};
//     console.log("Looking for online engines using GET request...");
//     request(url, function(error, res, body){
//         //console.log(JSON.parse(body)[0]["Message"]["Value"]);
//         var message = JSON.parse(body)[0]["Message"]["Value"];
//         message.forEach(object => {
//             if (object["Role"] == "Engine"){
//                 engines.push(object["Name"]);
//             }
//         });
//         console.log("Found currently running engines:");
//         for (let i = 0; i < engines.length; i++){
//             console.log(engines[i]);
//         }
//     });
// }

function getOnlineEngines(){
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    console.log("Looking for online engines using POST request...");
    request.post({
        url: baseUrl,
        body: buildPayload(topic, message),
        json: true
    }, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        else {
            var message = body[0]["Message"]["Value"];
            message.forEach(object => {
                if (object["Role"] == "Engine"){
                    engines.push(object["Name"]);
                }
            });
            console.log("Found currently running engines:");
            for (let i = 0; i < engines.length; i++){
                console.log(engines[i]);
            }
        }
    });
}

// function callBpFunctionOld(targetEngine, targetObject, functionName, functionArguments){
//     let topic = buildCallFunctionTopic(targetEngine);
//     console.log(topic);
//     let message = buildCallFunctionMessage(targetObject, functionName, functionArguments);
//     console.log(message);
//     let url = zmqFrameToUrl(topic, message);
//     console.log(url);
//     request.post({
//         url: url,
//         body: {},
//         json: true
//     }, (error, response, body) => {
//         console.log("Function " + functionName + " called on " + targetEngine + "!");
//         //console.log(body[0]);
//     });
// }

function callBpFunction(targetEngine, targetObject, functionName, functionArguments){
    let payload = buildCallFunctionPayload(targetEngine, targetObject, functionName, functionArguments);
    console.log(payload);
    request.post({
        url: baseUrl,
        body: payload,
        json: true
    }, (error, response, body) => {
        if (error){
            console.log(error);
        }
        else {
            console.log(body);
        }
    });
}

function callBpFunctionBroadcast(targetEnginesArray, targetObject, functionName, functionArguments){
    targetEnginesArray.forEach(engine => {
        let payload = buildCallFunctionPayload(engine, targetObject, functionName, functionArguments);
        console.log(payload);
        request.post({
            url: baseUrl,
            body: payload,
            json: true
        }, (error, response, body) => {
            if (error){
                console.log(error);
            }
            else {
                console.log(body);
            }
        });
    })
}
//End of helper functions;

getOnlineEngines();

function testPixotopeGatewayInterface(){
    callBpFunctionBroadcast(["~LOCAL~-Engine"], "BP_ViaCallFunctionWithActor_2", "Example4Function", [90, 12, 1]);
};

// setTimeout(() => {
//     test();
// }, 1000);
