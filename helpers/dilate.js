const voxelCube = require('../modules/binaryVoxelCube.js');
const fileLoader = require('../modules/loader.js');
const exportCube = require('../modules/exportImages.js');
const ArgumentParser = require('argparse').ArgumentParser;

var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Argparse example'
});

parser.addArgument(
  [ '-s', '--src' ],
  {
    help: 'Location of source photon file',
    required: true
  }
);

parser.addArgument(
  [ '-d', '--dest' ],
  {
    help: 'Destination directory name',
    required: true
  }
);

parser.addArgument(
  [ '-r', '--radius' ],
  {
    help: 'Dilatation radius',
    required: true
  }
)

const args = parser.parseArgs();

const r=parseInt(args.radius);

if (isNaN(r) || r<=0){
  throw new Error('Radius must be natural number');
}

let original;

try {
  let photonFile = fileLoader(args.src);
  original=new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels);
} catch(err) {
  throw Error("Photon file cannot be loaded");
}

let ret = original.dilate(r);

try {
  exportCube(ret,args.dest);
} catch(err) {
  throw Error("Model cannot be exported");
}
