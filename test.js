let voxelCube = require('./binaryVoxelCube.js');
let fileLoader = require('./loader.js');
const bitArray = require('bit-array');

/*let photonFile = fileLoader('./photonTest.photon');

console.log('photon file resolution: ',photonFile.header.resX,', ',photonFile.header.resY,', ',photonFile.layers.length);

console.log('pixel should be 1 '+photonFile.voxels.get(1907083));

var totalpixels=0;
var zeroes=0;
var ones=0;
for(var i=0;i<photonFile.voxels.length;i++){
  totalpixels++;
  if(!!photonFile.voxels.get(i)){
    ones++;
  }
  if(!photonFile.voxels.get(i)){
    zeroes++;
  }
}*/

//let cube=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
//
// console.log(cube.voxelData.length);
//
// console.log(cube.getVoxel(0,0,0),cube.getVoxel(1000,500,15),cube.getVoxel(2,2,2));

let empty=[0,0,0,0,0,0,0,0,0];
let line=[0,0,1,1,1,1,1,0,0];
let inside=[0,0,1,0,0,0,1,0,0];
let point=[0,0,0,0,1,0,0,0,0];
let full=[1,1,1,1,1,1,1,1,1];

let cap=empty.concat(empty).concat(line).concat(line).concat(line).concat(line).concat(line).concat(empty).concat(empty);
let layer=empty.concat(empty).concat(line).concat(inside).concat(inside).concat(inside).concat(line).concat(empty).concat(empty);
let nothing=empty.concat(empty).concat(empty).concat(empty).concat(empty).concat(empty).concat(empty).concat(empty).concat(empty);

let cross=point.concat(point).concat(point).concat(point).concat(full).concat(point).concat(point).concat(point).concat(point);
let pilar=empty.concat(empty).concat(empty).concat(empty).concat(point).concat(empty).concat(empty).concat(empty).concat(empty);

let cubeVox=cap.concat(layer).concat(layer).concat(layer).concat(layer).concat(layer).concat(cap).concat(nothing).concat(nothing);

let axisVox=pilar.concat(pilar).concat(pilar).concat(pilar).concat(cross).concat(pilar).concat(pilar).concat(pilar).concat(pilar);

let cubeArray=new bitArray(9*9*9);
let axisArray=new bitArray(9*9*9);

for(var i=0;i<9*9*9;i++){
  cubeArray.set(i,cubeVox[i]);
  axisArray.set(i,axisVox[i]);
}

let cube=new voxelCube(9,9,9,cubeArray);
let axis=new voxelCube(9,9,9,axisArray);

/*let flooded=cube.flood(0,0,1,true);

let caves=flooded.voxelData.not();

cube.voxelData=cube.voxelData.or(caves);*/

var render = cube.booleanDifference(axis);

for(let i=0;i<9;i++){
  console.log(render.renderLayer(i));
  console.log('---------')
}
