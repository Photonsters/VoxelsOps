const fileLoader=require('../../modules/loader.js');
const voxelCube=require('../../modules/binaryVoxelCubeAsync.js');
const commonChannel=require('../../modules/progressBars.js');
const exportImages=require('../../modules/exportImages.js');
const importImages=require('../../modules/imageLoader.js');
const ArgumentParser = require('argparse').ArgumentParser;
const path = require('path');
const bitArray = require('bit-array');

var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Argparse example'
});

parser.addArgument(
  [ '-s', '--src' ],
  {
    help: 'Location of texture png',
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
  [ '-z', '--height' ],
  {
    help: 'objectHeight',
    default: 30
  }
);

const args = parser.parseArgs();

args.src=path.resolve(args.src);

if(!args.dest){
  args.dest=args.src.replace('.png','.eroded');
} else {
  args.dest=path.resolve(args.dest);
}

new voxelCube(1440,2560,0,new bitArray(0),null,commonChannel).then((model)=>{
    importImages.loadImage(args.src).then(png=>{
      importImages.pngToArray(png).then(heightmap=>{
        model.verticalMap(heightmap,args.height,0,false).then(ret=>{
          exportImages(ret,args.dest,commonChannel).then(()=>{
            console.log('done');
          });
        });
      });
    });
  //});
});
