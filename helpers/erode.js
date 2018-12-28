const voxelCube = require('../modules/binaryVoxelCubeAsync.js');
const fileLoader = require('../modules/loader.js');
const exportCube = require('../modules/exportImages.js');
const ArgumentParser = require('argparse').ArgumentParser;
const commonChannel=require('../modules/progressBars.js');
const path = require('path');

const projectId=commonChannel.generateId();
commonChannel.emit("progress",{
  method:'erosionProgress',
  message:"erosion progress",
  percent:0,
  state:"start",
  projectId
});

let projectCounter=0;
let projectStep=100/4;

function progressProject(){
  projectCounter+=projectStep
  commonChannel.emit("progress",{
    method:'projectionMapTest',
    message:"projection map test pending",
    percent:Math.round(projectCounter),
    state:"pending",
    projectId
  });
}

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
    help: 'Destination directory name'
  }
);

parser.addArgument(
  [ '-r', '--radius' ],
  {
    help: 'erosion radius',
    required: false
  }
)

parser.addArgument(
  [ '-x', '--radiusX' ],
  {
    help: 'erosion radius x-axis',
    required: false
  }
)

parser.addArgument(
  [ '-y', '--radiusY' ],
  {
    help: 'erosion radius y-axis',
    required: false
  }
)

parser.addArgument(
  [ '-z', '--radiusZ' ],
  {
    help: 'erosion radius z-axis',
    required: false
  }
)

const args = parser.parseArgs();

const r=parseInt(args.radius);
const x=parseInt(args.radiusX);
const y=parseInt(args.radiusY);
const z=parseInt(args.radiusZ);



if (r && isNaN(r) || r<=0){
  throw new Error('Radius must be natural number');
}

if (!r && !x && !y && !z){
  throw new Error('Radius any partial radius must be defined');
}

if(r && (x || y || z)){
  throw new Error('Do not combine radius with partial erosion');
}

args.src=path.resolve(args.src)

if(!args.dest){
  args.dest=args.src.replace('.photon','.eroded');
}

fileLoader.async(args.src,commonChannel).then(photonFile=>{
  progressProject();
  new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels,null,commonChannel).then((original)=>{
    progressProject();
    if(r){
      original.erode(r).then(ret => {
        progressProject();
        exportCube(ret,args.dest,commonChannel).then(()=>{
          progressProject();
          commonChannel.emit("progress",{
            method:'erosionProgress',
            message:"erosion progress finished",
            percent:100,
            state:"end",
            projectId
          });
        }).catch(err => {
          throw new Error(err);
        });
      }).catch(err => {
        throw new Error(err);
      });
    } else {
      original.erodeDirectional(x||0,y||0,z||0).then(ret => {
        progressProject();
        exportCube(ret,args.dest,commonChannel).then(()=>{
          progressProject();
          commonChannel.emit("progress",{
            method:'erosionProgress',
            message:"erosion progress finished",
            percent:100,
            state:"end",
            projectId
          });
        }).catch(err => {
          throw new Error(err);
        });
      }).catch(err => {
        throw new Error(err);
      });
    }
  }).catch(err => {
    throw new Error(err);
  });
}).catch(err => {
  throw new Error(err);
});
