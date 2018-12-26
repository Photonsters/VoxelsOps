const fileLoader=require('../modules/loader.js');
const voxelCube=require('../modules/binaryVoxelCubeAsync.js');
const event=require('../modules/event.js');
const startTime = Date.now();
const ArgumentParser = require('argparse').ArgumentParser;
const infoChannel=require('../modules/progressBars.js');

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

const args = parser.parseArgs();


fileLoader.async(args.src,infoChannel).then((photonFile)=>{
  console.log("counting build area...");
  const buildArea=photonFile.voxels.size();
  console.log("measuring model size...");
  const voxelCount=photonFile.voxels.count();
  const layerThickness=Math.round(10000*photonFile.header.layerThickness)/10000;
  const voxelVolume=0.047*0.047*layerThickness;
  console.log("PHOTON FILE HEADER:",photonFile.header);
  console.log("--------------------------------------------------------------");
  console.log("Number of pixels: "+voxelCount);
  console.log("Build area: "+buildArea);
  console.log("Density: "+(voxelCount/buildArea*100)+"%");
  console.log("--------------------------------------------------------------");
  console.log("Horizontal pixel size: 0.047mm");
  console.log("Vertical pixel size: "+layerThickness+"mm");
  console.log("Voxel volume: "+(voxelVolume)+"mm^3");
  console.log("Total volume: "+(voxelVolume*voxelCount)+"mm^3");
  console.log("           ~: "+(Math.round(voxelVolume*voxelCount)*0.001)+"ml");
});
