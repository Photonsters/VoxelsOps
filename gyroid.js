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
  [ '-s', '--src' ],
  {
    help: 'Location of source photon file (required)',
    required: true
  }
);

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
  [ '-b', '--block' ],
  {
    help: 'exponent for blocky erosion, recomended 1-2 (def.: 1)',
    defaultValue: 1
  }
);

parser.addArgument(
  [ '--smooth' ],
  {
    help: 'smooth erode when scaled (def.: 1)',
    defaultValue: 1
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
    defaultValue: 0.3
  }
);

const args = parser.parseArgs();

if(!args.dest){
  args.dest=args.src.replace('.photon','.bitmaps');
}

const pattern=generators.gyroid(parseInt(args.pattern),parseFloat(args.tolerance));
timedLog("pattern generated");

let photonFile = fileLoader(args.src);
const big=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);

timedLog("model loaded");
console.log("Big volume:",big.volume());

let small=big.erode(parseInt(args.radius),parseInt(args.block),!!parseInt(args.smooth));
timedLog("model eroded");

let hollowed=big.booleanDifference(small);
timedLog("model hollowed");

let infill=pattern.booleanIntersect(big);
timedLog("infil created");

let merged=hollowed.booleanAdd(infill);
timedLog("merged together");
console.log("Merged volume:",merged.volume());
console.log("Saved material: "+Math.round(100-merged.volume()/big.volume()*100)+"%");

exportCube(merged,args.dest).then(()=>{
  timedLog("done");
});
