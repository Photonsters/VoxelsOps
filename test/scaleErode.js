const voxelCube = require('../binaryVoxelCube.js');
const fileLoader = require('../loader.js');
const exportCube = require('../exportImages.js');
const timedLog = require('../timedConsole.js');

timedLog("start");
let photonFile = fileLoader('../cube_test/cube.photon');
let model=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("model loaded");

console.time("not smooth");
hollow=model.erode(5,2,false);
console.timeEnd("not smooth");

console.time("smooth");
hollow=model.erode(5,2,true);
console.timeEnd("smooth");

timedLog("model eroded");

model=model.booleanDifference(hollow);

timedLog("hollowed");

exportCube(model,'./scale_erode').then(()=>{
  timedLog("done");
});
