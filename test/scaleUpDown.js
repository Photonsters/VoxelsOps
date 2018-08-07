const voxelCube = require('../binaryVoxelCube.js');
const fileLoader = require('../loader.js');
const exportCube = require('../exportImages.js');
const timedLog = require('../timedConsole.js');

timedLog("start");
let photonFile = fileLoader('../cube_test/cube.photon');
let model=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("model loaded");

console.log('total volume: ',model.volume());

timedLog("scaling down...");
model=model.scaleDown();
timedLog("scaled down.");

console.log('scaled (1x) volume: ',model.volume());

timedLog("scaling down...");
model=model.scaleDown();
timedLog("scaled down.");

console.log('scaled (2x) volume: ',model.volume());

timedLog("scaling up...");
model=model.scaleUp();
timedLog("scaled up.");

console.log('scaled (1x) volume: ',model.volume());

timedLog("scaling up...");
model=model.scaleUp();
timedLog("scaled up.");

console.log('original scale volume: ',model.volume());
