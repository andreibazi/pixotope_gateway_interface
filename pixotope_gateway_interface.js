//Pixotope Gateway v1.0a
//Written by Andrei Bazi

//This small package facilitates the interaction between your Node app and Pixotope, allowing for custom-built control panels that leverage the power of code and extend the functionality provided by the built-in Pixotope control panels. 
//This is currently under development. While still not perfect, I'm constantly testing this package live in broadcast, expanding it to suit my needs.

var axios = require('axios');
const { response } = require('express');
var baseUrl = 'http://localhost:16208/gateway/2.2.0/publish';

//This method is not used, keeping it for reference;
//var engines = [];
// function getOnlineEnginesGetRequest(){
//     var url = baseUrl + topicToUrl(buildStoreGetTopic("ConnectedClients"));
//     var topic = buildStoreGetTopic("ConnectedClients");
//     var message = {};
//     console.log("Looking for online engines using GET request...");
//     request(url, function(error, res, body){
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

//Helper functions:
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


function getOnlineClients(){
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    axios.post(baseUrl, buildPayload(topic, message)).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while looking for online clients.", error); return null;}).then(response => {if(response) return response.data;})
}

async function getOnlineClientsAsync(){
    var topic = buildStoreGetTopic("ConnectedClients");
    var message = {};
    try
    {
        let response = await axios.post(baseUrl, buildPayload(topic, message));
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while looking for online clients.", error);
        return null;
    }
}


function callBpFunction(targetEngine, targetObject, functionName, functionArguments){
    let payload = buildCallFunctionPayload(targetEngine, targetObject, functionName, functionArguments);
    axios.post(baseUrl, payload).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while calling Blueprint function %s with arguments %s on object %s and engine %s.", error, functionName, functionArguments, targetObject, targetEngine); return null;}).then(response=>{if(response) return response.data;});
}

async function callBpFunctionAsync(targetEngine, targetObject, functionName, functionArguments){
    let payload = buildCallFunctionPayload(targetEngine, targetObject, functionName, functionArguments);
    try
    {
        let response = await axios.post(baseUrl, payload)
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while calling Blueprint function %s with arguments %s on object %s and engine %s.", error, functionName, functionArguments, targetObject, targetEngine);
        return null;
    }
}


function callBpFunctionBroadcast(targetEnginesArray, targetObject, functionName, functionArguments){
    targetEnginesArray.forEach(engine => {
        let payload = buildCallFunctionPayload(engine, targetObject, functionName, functionArguments);
        console.log("***[PXG - CALL BP FUNCTION BROADCAST]*** - Sending %s to engines %s", JSON.stringify(payload), targetEnginesArray);
        axios.post(baseUrl, payload).catch(error=>{console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while calling Blueprint function %s with arguments %s on object %s and engines %s.", error, functionName, functionArguments, targetObject, targetEnginesArray); return null;}).then(response=>{if(response) return response.data;});
    });
}

async function callBpFunctionBroadcastAsync(targetEnginesArray, targetObject, functionName, functionArguments){
    try
    {
        //throw Error('***[PXG - ERROR]*** - Method \"callBpFunctionBroadcastAsync\" not implemented yet!');
        for (const engine of targetEnginesArray)
        {
            let payload = buildCallFunctionPayload(engine, targetObject, functionName, functionArguments);
            console.log("***[PXG - CALL BP FUNCTION BROADCAST ASYNC]*** - Sending %s to engines", JSON.stringify(payload));
            let response = await axios.post(baseUrl, payload);
            return response.data;
        }
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while calling Blueprint function %s with arguments %s on object %s and engines %s.", error, functionName, functionArguments, targetObject, targetEnginesArray);
        return null;
    }
}


function saveToStoreState(location, data){
    let topic = buildStoreSetTopic(location);
    let message = {"Value": data};
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while saving %s to Store state at location %s.", error, data, location); return null;}).then(response =>{if (response){return response.data;} else {return null;}});
}

async function saveToStoreStateAsync(location, data){
    let topic = buildStoreSetTopic(location);
    let message = {"Value": data};
    let payload = buildPayload(topic, message);
    try
    {
        let response = await axios.post(baseUrl, payload);
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while saving %s to Store state at location %s.", error, data, location);
        return null;
    }
}


function loadFromStoreState(location, callback){
    axios.get(topicToUrl(buildStoreGetTopic(location))).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while loading %s from Store state.", error, location);}).then(response => {if(response) {callback(response.data);} else {callback(null);}});
}

async function loadFromStoreStateAsync(location){
    try
    {
        let response = await axios.get(topicToUrl(buildStoreGetTopic(location)));
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while loading %s from the store state.", error, location);
        return null;
    }
}


function saveToEngineState(engine, location, data){
    let topic = buildStateSetTopic(engine, location);
    let message = {"Value": data };
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error =>{console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while saving %s to engine %s state at location %s.", error, data, JSON.stringify(payload), location); return null;}).then(response => {return response.data;});
}

async function saveToEngineStateAsync(engine, location, data){
    let topic = buildStateSetTopic(engine, location);
    let message = {"Value": data };
    let payload = buildPayload(topic, message);
    try
    {
        let response = await axios.post(baseUrl, payload);
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while saving %s to engine %s state at location %s.", error, JSON.stringify(payload), engine, location);
        return null;
    }
}


function loadFromEngineState(engine, location, callback){
    axios.get(topicToUrl(buildStateGetTopic(engine, location))).catch(error =>{console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while loading %s from engine %s state.", error, location, engine);return null;}).then(response => {if(response){callback(response.data);} else {callback(null);}});
}

async function loadFromEngineStateAsync(engine, location){
    console.log(topicToUrl(buildStateGetTopic(engine, location)));
    try
    {
        let response = await axios.get(topicToUrl(buildStateGetTopic(engine, location)));
        return response;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while loading %s from engine %s state.", error, location, engine);
        return null;
    }
}


function getProperty(engine, objectName, propertyName, callback){
    let topic = buildGetPropertyTopic(engine);
    let message = buildGetPropertyMessage(objectName, propertyName);
    axios.get(zmqFrameToUrl(topic, message)).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while getting property %s from actor %s of engine %s.", error, propertyName, objectName, engine);return null;}).then(response => {if(response){callback(response.data);} else {callback(null);}});
}

async function getPropertyAsync(engine, objectName, propertyName){
    let topic = buildGetPropertyTopic(engine);
    let message = buildGetPropertyMessage(objectName, propertyName);
    try
    {
        let response = await axios.get(zmqFrameToUrl(topic, message));
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while getting property %s from actor %s of engine %s.", error, propertyName, objectName, engine);
        return null;
    }
}


function setProperty(engine, objectName, propertyName, propertyValue){
    let topic = buildSetPropertyTopic(engine);
    let message = buildSetPropertyMessage(objectName, propertyName, propertyValue);
    let payload = buildPayload(topic, message);
    axios.post(baseUrl, payload).catch(error => {console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while setting property %s to value %s in actor %s of engine %s.", error, propertyName, value, objectName, engine); return null;}).then(response =>{if(response) return response.data;});
}

async function setPropertyAsync(engine, objectName, propertyName, propertyValue){
    let topic = buildSetPropertyTopic(engine);
    let message = buildSetPropertyMessage(objectName, propertyName, propertyValue);
    let payload = buildPayload(topic, message);
    try
    {
        let response = await axios.post(baseUrl, payload);
        return response.data;
    }
    catch(error)
    {
        console.log("***[PXG - ERROR]*** - Ran into error \"%s\" while setting property %s to value %s in actor %s of engine %s.", error, propertyName, value, objectName, engine);
        return null;
    }
}


module.exports={getOnlineClients, getOnlineClientsAsync, callBpFunctionBroadcast, callBpFunctionBroadcastAsync, callBpFunction, callBpFunctionAsync, saveToStoreState, saveToStoreStateAsync, loadFromStoreState, loadFromStoreStateAsync, getProperty, getPropertyAsync, setProperty, setPropertyAsync, loadFromEngineState, loadFromEngineStateAsync, saveToEngineState, saveToEngineStateAsync};