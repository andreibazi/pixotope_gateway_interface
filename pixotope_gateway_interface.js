//Pixotope Gateway v1.1a
//Written by Andrei Bazi

//This small package facilitates the interaction between your Node.JS app and Pixotope, allowing for custom-built control panels that leverage the power of code and extend the functionality provided by the built-in Pixotope control panels. 
//This is currently under development. While still not perfect, I'm constantly testing this package live in broadcast, expanding it to suit my needs.

var axios = require('axios');
const { response } = require('express');
var baseUrl = 'http://localhost:16208/gateway/2.2.0/publish';

//Helper functions:
function logError(error){
    console.log("[ERROR] Received the following error code:", error.code);
}

function parseResponse(response){
    if (!response){
        console.log("[CLIENTS] Please make sure Pixotope is running!");
        return null;
    }
    return response.data;
}
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
//End of helper functions;


async function getOnlineClientsAsync(){
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    console.log("[CLIENTS] Asking Pixotope Gateway for a list of online engines...");
    let response = await axios.post(baseUrl, buildPayload(topic, message)).catch(error => {
        logError(error);
    });
    let parsedResponse = parseResponse(response);
    return parsedResponse;
}


function callBpFunction(targetEngine, targetObject, functionName, functionArguments){
    let payload = buildCallFunctionPayload(targetEngine, targetObject, functionName, functionArguments);
    console.log(payload);
    axios.post(baseUrl, payload).catch(error => {
        logError(error);
    }).then(response=>{
        let parsedResponse = parseResponse(response);
        if (parsedResponse){
            console.log(parsedResponse);
        }
    });
}


function callBpFunctionBroadcast(targetEnginesArray, targetObject, functionName, functionArguments){
    targetEnginesArray.forEach(engine => {
        let payload = buildCallFunctionPayload(engine, targetObject, functionName, functionArguments);
        console.log(payload);
        axios.post(baseUrl, payload).catch(error => {
            logError(error);
        }).then(response=>{
            let parsedResponse = parseResponse(response);
            if (parsedResponse){
                console.log(parsedResponse);
            }
        });
    })
}


function saveToStoreState(location, data){
    let topic = buildStoreSetTopic(location);
    let message = {"Value": data};
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        console.log("[ERROR] Received the following error code:", error.code);
    }).then(response => {
        let parsedResponse = parseResponse(response);
        if (!parsedResponse){
            return false;
        }
        console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set data on store at " + location + " with response: ", response.data);
        return true;
    });
}

async function loadFromStoreStateAsync(location){
    let response = await axios.get(topicToUrl(buildStoreGetTopic(location)));
    let parsedResponse = parseResponse(response);
    return parsedResponse;
}


function saveToEngineState(engine, location, data){
    let topic = buildStateSetTopic(engine, location);
    let message = {"Value": data };
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        logError(error);
    }).then(response => {
        let parsedResponse = parseResponse(response);
        if (parsedResponse){
            console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set data on state at " + location + " with response: ", parsedResponse);
        }
    });
}

async function loadFromEngineStateAsync(engine, location){
    console.log(topicToUrl(buildStateGetTopic(engine, location)));
    let response = await axios.get(topicToUrl(buildStateGetTopic(engine, location)));
    let parsedResponse = parseResponse(response);
    return parsedResponse;
}

async function getPropertyAsync(engine, objectName, propertyName){
    let topic = buildGetPropertyTopic(engine);
    let message = buildGetPropertyMessage(objectName, propertyName);
    let response = await axios.get(zmqFrameToUrl(topic, message));
    let parsedResponse = parseResponse(response);
    return parsedResponse;
}


function setProperty(engine, objectName, propertyName, propertyValue){
    let topic = buildSetPropertyTopic(engine);
    let message = buildSetPropertyMessage(objectName, propertyName, propertyValue);
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {
        logError(error);
    }).then(response => {
        let parsedResponse = parseResponse(response);
        if (parsedResponse){
            console.log("*** [PIXOTOPE GATEWAY] *** - Successfuly set property " + propertyName + " on object " + objectName + " to value " + propertyValue, parsedResponse);
        }
    });
}


module.exports={getOnlineClientsAsync, callBpFunctionBroadcast, callBpFunction, saveToStoreState, loadFromStoreStateAsync, getPropertyAsync, setProperty, loadFromEngineStateAsync, saveToEngineState};