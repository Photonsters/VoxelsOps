const generators = require('./generators.js')
const voxelCube = require('./binaryVoxelCube.js');
const fileLoader = require('./loader.js');
const exportCube = require('./exportImages.js');
const timedLog = require('./timedConsole.js');
const ArgumentParser = require('argparse').ArgumentParser;
const startTime = Date.now();

var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Argparse example'
});

parser.addArgument(
  [ '-d', '--dest' ],
  {
    help: 'Destination directory name (def.: generated from src)',
  }
);

parser.addArgument(
  [ '-r', '--radius' ],
  {
    help: 'erosion radius / wall thickness (in voxels, def.: 15)',
    defaultValue: 15
  }
);

parser.addArgument(
  [ '-p', '--pattern' ],
  {
    help: 'pattern size (in voxels, def.: 100)',
    defaultValue: 100
  }
);

parser.addArgument(
  [ '-t', '--tolerance' ],
  {
    help: 'gyroid generator tolerance (def.: 0.3)',
    defaultValue: 0.15
  }
);

const args = parser.parseArgs();

if(!args.dest){
  args.dest='./cube_test/export';
}

const pattern=generators.gyroid(parseInt(args.pattern),parseFloat(args.tolerance));
timedLog("pattern generated");

let photonFile = fileLoader('./cube_test/cube.photon');
let model=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
model=model.translate(300,500,0);
let copy=model.translate(-500,0,0);

timedLog("models loaded");
console.log("model volume:",model.volume());

let small=model.erode(parseInt(args.radius));
timedLog("model eroded");

let hollowed=model.booleanDifference(small);
timedLog("model hollowed");

let infill=pattern.booleanIntersect(model);
timedLog("infil created");

let merged=hollowed.booleanAdd(infill);
timedLog("merged together");
console.log("Merged volume:",merged.volume());
console.log("Saved material: "+Math.round(100-merged.volume()/model.volume()*100)+"%");

merged=merged.booleanAdd(copy);

exportCube(copy.booleanAdd(merged),args.dest).then(()=>{
  timedLog("done");
});
