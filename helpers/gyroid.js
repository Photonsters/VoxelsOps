const fileLoader=require('../modules/loader.js');
const generators = require('../modules/generators.js')
const voxelCube=require('../modules/binaryVoxelCubeAsync.js');
const event=require('../modules/event.js');
const exportImages=require('../modules/exportImages.js');
const path=require('path');
const startTime = Date.now();
const ArgumentParser = require('argparse').ArgumentParser;
//const timedLog = require('./modules/timedConsole.js');

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
    defaultValue: 5
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

const infoChannel=new event();
infoChannel.on("progress",(data)=>{
  console.log(data);
});


infoChannel.emit("progress",{ method: 'Infill generator',
  message: 'Generator starts',
  percent: 0,
  state: 'start' });
fileLoader.async(args.src,infoChannel).then((photonFile)=>{
  const zScale=(photonFile.header.layerThickness/0.047);
  infoChannel.emit("progress",{ method: 'Infill generator',
    message: 'File loaded',
    percent: 12,
    state: 'pending' });
  new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels,null,infoChannel).then((original)=>{
    infoChannel.emit("progress",{ method: 'Infill generator',
      message: 'Voxels exported',
      percent: 25,
      state: 'pending' });
    generators.gyroid(args.pattern,args.tolerance,infoChannel,zScale).then(pattern => {
      infoChannel.emit("progress",{ method: 'Infill generator',
        message: 'Gyroid generated',
        percent: 37,
        state: 'pending' });
      original.erodeDirectional({x:args.radius,y:args.radius,z:Math.round(args.radius*zScale)},args.block,args.smooth).then(eroded => {
        infoChannel.emit("progress",{ method: 'Infill generator',
          message: 'Eroded',
          percent: 50,
          state: 'pending' });
        eroded.booleanIntersect(pattern).then(infill => {
          infoChannel.emit("progress",{ method: 'Infill generator',
            message: 'Infill generated',
            percent: 50,
            state: 'pending' });
          original.booleanDifference(eroded).then(shell => {
            infoChannel.emit("progress",{ method: 'Infill generator',
              message: 'Shell generated',
              percent: 62,
              state: 'pending' });
            shell.booleanAdd(infill).then(final => {
              infoChannel.emit("progress",{ method: 'Infill generator',
                message: 'Composite generated',
                percent: 75,
                state: 'pending' });
              exportImages(final,args.dest,infoChannel).then(()=>{
                infoChannel.emit("progress",{ method: 'Infill generator',
                  message: "Done. Volume saved: "+(100-final.volume()/original.volume()*100)+"%",
                  percent: 100,
                  state: 'end' });
              });
            });
          });
        });
      });
    });
  });
});
