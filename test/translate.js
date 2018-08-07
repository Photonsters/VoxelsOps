const voxelCube = require('../binaryVoxelCube.js');
const fileLoader = require('../loader.js');
const exportCube = require('../exportImages.js');
const timedLog = require('../timedConsole.js');

timedLog("start");
let photonFile = fileLoader('../cube_test/cube.photon');
const model=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("model loaded");

let moved=model.translate(500,500,0);
timedLog("model translated");

exportCube(moved,'./translate_test').then(()=>{
  timedLog("done");
});
