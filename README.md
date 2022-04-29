# Pixotope Gateway Interface

## What it is
This repo is a collection of methods that aim to make interfacing with Pixotope's Gateway API much easier and quicker.


## Sample code:
```
var  pixotope = require('pixotope_gateway_interface');

pixotope.getOnlineEngines();

pixotope.callBpFunctionBroadcast(["~LOCAL~-Engine"], "BP_ViaCallFunctionWithActor_2", "Example4Function", [12]);

pixotope.saveToStoreState("State.ThirdParty.Examples.ViaStore", 12);

pixotope.loadFromStoreStateAsync("State.ThirdParty.Examples.ViaStore").then(response  =>  console.log(response));

pixotope.getPropertyAsync("~LOCAL~-Engine", "BP_ViaSetPropertyWithActor_2", "ExampleVar").then(response  =>  console.log(response[0]["Message"]["Result"][0]["Property"]["Value"]));

pixotope.setProperty("~LOCAL~-Engine", "BP_ViaSetPropertyWithActor_2", "ExampleVar", 25);

pixotope.getPropertyAsync("~LOCAL~-Engine", "BP_ViaSetPropertyWithActor_2", "ExampleVar").then(response  =>  console.log(response[0]["Message"]["Result"][0]["Property"]["Value"]));

pixotope.loadFromEngineStateAsync("~LOCAL~-Engine", "State.ThirdParty.Examples.ViaEngine").then(response  =>  console.log(response.data[0]["Message"]["Value"]));

pixotope.saveToEngineState("~LOCAL~-Engine", "State.ThirdParty.Examples.ViaEngine", "10");
```

## To do
Error handling
