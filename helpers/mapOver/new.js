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
  [ '-t', '--texture' ],
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
  [ '-f', '--filter' ],
  {
    help: 'filter strength in pixels',
    default: 30
  }
);

args.texture=path.resolve(args.texture);

if(!args.dest){
  args.dest=args.src.replace('.png','.eroded');
} else {
  args.dest=path.resolve(args.dest);
}

const args = parser.parseArgs();

new voxelCube(1440,2560,0,new bitArray(0),null,commonChannel).then((model)=>{
    importImages.loadImage(args.texture).then(png=>{
      importImages.pngToArray(png).then(heightmap=>{
        model.verticalMap(heightmap,args.filter,0,false).then(ret=>{
          exportImages(ret,args.dest,commonChannel).then(()=>{
            console.log('done');
          });
        });
      });
    });
  //});
});
