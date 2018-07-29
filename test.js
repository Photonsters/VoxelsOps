const voxelCube = require('./binaryVoxelCube.js');
const fileLoader = require('./loader.js');
const exportCube = require('./exportImages.js');
const timedLog = require('./timedConsole.js');
const startTime = Date.now();

let photonFile = fileLoader('./gyroid_resources/big.photon');
const big=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("big sphere loaded");
console.log("Big volume:",big.volume());

/*photonFile = fileLoader('./gyroid_resources/infill.photon');
const infill=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
timedLog("infill loaded");
console.log("infill volume:",infill.volume());*/

timedLog('test start (erode):');
let small=big.erode(1);
timedLog('test end.');

timedLog('creating shell');
let shell=big.booleanDifference(small);

timedLog('test start (dilate)');
let puffy=shell.dilate(5);
timedLog('test end.');

exportCube(puffy,'eroded');

/*timedLog('Creating shell:');
let dif=big.booleanDifference(small);
timedLog('test end.');
console.log("Difference volume:",dif.volume());

timedLog('Creating infill:');
let intersected=small.booleanIntersect(infill);
timedLog('test end.');
console.log("Infill volume:",intersected.volume());

timedLog('Merging:');
let merged=dif.booleanAdd(intersected);
timedLog('test end.');
console.log("Merged volume:",merged.volume());

console.log("Saved(%):",Math.round(merged.volume()/big.volume()*10000)/100);

exportCube(merged,'eroded');*/

timedLog('done in '+(Date.now()-startTime)/1000+'s');
