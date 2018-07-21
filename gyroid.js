const voxelCube = require('./binaryVoxelCube.js');
const fileLoader = require('./loader.js');
const exportCube = require('./exportImages.js');
const timedLog = require('./timedConsole.js');

let photonFile = fileLoader('./gyroid_resources/big.photon');
const big=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("big sphere loaded");
console.log(big.sizeZ);

photonFile = fileLoader('./gyroid_resources/support.photon');
const support=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("support loaded");
console.log(support.sizeZ);

photonFile = fileLoader('./gyroid_resources/small.photon');
const small=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("small sphere loaded");

photonFile = fileLoader('./gyroid_resources/infill.photon');
const infill=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("infill loaded");

photonFile = fileLoader('./gyroid_resources/hole.photon');
const hole=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("hole loaded");

let suportedSphere = big.booleanAdd(support);
timedLog("big sphere unified with support");
console.log(suportedSphere.sizeZ);

let hollowedSphere = suportedSphere.booleanDifference(small);
timedLog("small sphere is cut from big");

let infillSphere = small.booleanIntersect(infill);
timedLog("infill sphere is cut from small sphere");

let filledSphere = hollowedSphere.booleanAdd(infillSphere);
timedLog("supported sphere is filled with infill pattern");

let holedSphere = filledSphere.booleanDifference(hole);
timedLog("hole is cut in bottom of sphere");

//here we should remove pivot, but it is actually not necessary, since it was removed in last step...

exportCube(holedSphere,'gyroid_combined');
