const fileLoader=require('../../modules/loader.js');
const voxelCube=require('../../modules/binaryVoxelCubeAsync.js');
const commonChannel=require('../../modules/progressBars.js');
const exportImages=require('../../modules/exportImages.js');
const importImages=require('../../modules/imageLoader.js');

fileLoader.async('./model.photon',commonChannel).then((photonFile)=>{
  new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels,null,commonChannel).then((model)=>{
    //model.booleanDifference(model).then(model=>{
      importImages.loadImage('./texture.png').then(png=>{
        importImages.pngToArray(png).then(heightmap=>{
          model.projectionMap(heightmap,30,-15,'topBottom').then(ret=>{
            exportImages(ret,'./export',commonChannel).then(()=>{
              console.log('done');
            });
          });
        });
      });
    //});
  });
});
