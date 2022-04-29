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

var axios = require('axios');
const { response } = require('express');
var baseUrl = 'http://localhost:16208/gateway/2.2.0/publish';
var gateways = ["10.97.3.15", "10.97.3.16", "10.97.3.17"]; //probably need just one gateway, the one set as server?

//Aici salvam motoarele online:
var engines = [];

//Helper functions:

//These functions are useful for performing get requests:
function topicToUrl(topic){
    var urlTail = "?";
    for (const [key, value] of Object.entries(topic)){
        urlTail += key + "=" + value + "&";
    }
    return baseUrl + urlTail.slice(0, -1);
}

function zmqFrameToUrl(topic, message){
    var urlTail = "?";
    for (const [key, value] of Object.entries(topic)){
        urlTail += key + "=" + value + "&";
    }
    for (const [key, value] of Object.entries(message["Params"])){
        urlTail += "Param" + key + "=" + value + "&";
    }
    return baseUrl + urlTail.slice(0, -1);
}
//End of region

function buildStoreGetTopic(name){
    var topic = {Type: "Get", Target: "Store", Name: name};
    return topic;
}

function buildStoreSetTopic(name){
    var topic = {Type: "Set", Target: "Store", Name: name};
    return topic;
}

function buildStateGetTopic(engine, name){
    return {Type: "Get", Target: engine, Name: name};
}

function buildStateSetTopic(engine, name){
    return {Type: "Set", Target: engine, Name: name};
}

function buildGetPropertyTopic(engine){
    return {Type: "Call", Target: engine, Method: "GetProperty"};
}

function buildSetPropertyTopic(engine){
    return {Type: "Call", Target: engine, Method: "SetProperty"};
}

function buildGetPropertyMessage(objectName, propertyName){
    return {"Params":{"ObjectSearch": objectName, "PropertyPath": propertyName}};
}

function buildSetPropertyMessage(objectName, propertyName, propertyValue){
    return {"Params":{"ObjectSearch": objectName, "PropertyPath": propertyName, "Value": propertyValue}};
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

function getOnlineEnginesGetRequest(){
    var url = baseUrl + topicToUrl(buildStoreGetTopic("ConnectedClients"));
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    console.log("Looking for online engines using GET request...");
    request(url, function(error, res, body){
        //console.log(JSON.parse(body)[0]["Message"]["Value"]);
        var message = JSON.parse(body)[0]["Message"]["Value"];
        message.forEach(object => {
            if (object["Role"] == "Engine"){
                engines.push(object["Name"]);
            }
        });
        console.log("Found currently running engines:");
        for (let i = 0; i < engines.length; i++){
            console.log(engines[i]);
        }
    });
}
//End of helper functions;

async function getOnlineClientsAsync(){
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    console.log("Looking for online engines using POST request...");
    let response = await axios.post(baseUrl, buildPayload(topic, message)).catch(error => {
        if (error){
            console.log(error);
        }
    })//.then(response => {
    //     
    // });
    return response.data;
}

function callBpFunction(targetEngine, targetObject, functionName, functionArguments){
    let payload = buildCallFunctionPayload(targetEngine, targetObject, functionName, functionArguments);
    console.log(payload);
    axios.post(baseUrl, payload).catch(error => {
        console.log(error);
    }).then(response=>{
        console.log(response.data);
    });
}

function callBpFunctionBroadcast(targetEnginesArray, targetObject, functionName, functionArguments){
    targetEnginesArray.forEach(engine => {
        let payload = buildCallFunctionPayload(engine, targetObject, functionName, functionArguments);
        console.log(payload);
        axios.post(baseUrl, payload).catch(error => {
            console.log(error);
        }).then(response=>{
            console.log(response.data);
        });
    })
}

function saveToStoreState(location, data){
    let topic = buildStoreSetTopic(location);
    let message = {"Value": data};
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        console.log(error);
    }).then(response => {
        console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set data on store at " + location + " with response: ", response.data);
    });
}

async function loadFromStoreStateAsync(location){
    let response = await axios.get(topicToUrl(buildStoreGetTopic(location)));
    return response.data;
}

function saveToEngineState(engine, location, data){
    let topic = buildStateSetTopic(engine, location);
    let message = {"Value": data };
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        console.log(error);
    }).then(response => {
        console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set data on state at " + location + " with response: ", response.data);
    });
}

async function loadFromEngineStateAsync(engine, location){
    console.log(topicToUrl(buildStateGetTopic(engine, location)));
    let response = await axios.get(topicToUrl(buildStateGetTopic(engine, location)));
    return response;
}

async function getPropertyAsync(engine, objectName, propertyName){
    let topic = buildGetPropertyTopic(engine);
    let message = buildGetPropertyMessage(objectName, propertyName);
    let response = await axios.get(zmqFrameToUrl(topic, message));
    return response.data;
}

function setProperty(engine, objectName, propertyName, propertyValue){
    let topic = buildSetPropertyTopic(engine);
    let message = buildSetPropertyMessage(objectName, propertyName, propertyValue);
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        console.log(error);
    }).then(response => {
        console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set property " + propertyName + " on object " + objectName + " to value " + propertyValue, response.data);
    });
}

module.exports={getOnlineClientsAsync, callBpFunctionBroadcast, callBpFunction, saveToStoreState, loadFromStoreStateAsync, getPropertyAsync, setProperty, loadFromEngineStateAsync, saveToEngineState};