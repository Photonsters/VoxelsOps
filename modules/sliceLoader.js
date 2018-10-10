const il = require('./imageLoader');
const fs = require('fs');
const path="../test/";
const bitArray = require('bit-array');
const event = require('./event');
const BinaryVoxelCube=require('./binaryVoxelCubeAsync.js');
const exportImages=require('./exportImages.js');

function loadDirectory(path, channel=null){
  channel=channel||new event();
  return new Promise((resolve,reject)=>{
    getImagePaths(path,channel).catch(reject).then((imagePaths)=>{
      getVoxelCube(path,imagePaths,channel).then(voxelCube=>{
        resolve(voxelCube);
      });
    });
  });
}

function getVoxelCube(path,imagePaths,channel){
  return new Promise((resolve,reject)=>{
    il.loadImage(path+imagePaths[0]).catch(reject).then(png=>{
      let width=png.width;
      let height=png.height;
      let area=(width*height);
      let voxelData=new bitArray(area*imagePaths.length);
      let z=0;

      function parseLayer(z){
        channel.emit("progress",{
          method:'loadDirectory',
          message:"parsing layer no."+(z+1),
          percent:Math.round(z/imagePaths.length*100),
          state:"pending"
        });
        il.loadImage(path+imagePaths[z]).catch(reject).then(png=>{
          il.pngToBitArray(png,128).then((layerVoxels)=>{
            for(y=0;y<height;y++){
              for(x=0;x<width;x++){
                voxelData.set(z*area+y*width+x,layerVoxels.get((y*width+x)));
              }
            }
            if(z+1>=imagePaths.length){
              new BinaryVoxelCube(width,height,imagePaths.length,voxelData,null,channel).then(bvc=>{
                channel.emit("progress",{
                  method:'loadDirectory',
                  message:"voxelCube created",
                  percent:100,
                  state:"end"
                });
                resolve(bvc);
              });
            } else {
              parseLayer(z+1);
            }
          })
        });
      }

      parseLayer(0);
    });
  });
}

function getImagePaths(path,channel){
  let imagePaths=[];
  return new Promise((resolve,reject)=>{
    channel.emit("progress",{
      method:'loadDirectory',
      message:"getting image paths",
      percent:0,
      state:"start"
    });
    fs.readdir(path, function(err, items) {
      if(err){
        reject(err);
        return;
      }

      items.filter(item => {
        return item.match(/slice__\d{4}.png/);
      }).map(item => {
        imagePaths[parseInt(item.replace("slice__","").replace(".png",""))]=item;
      });

      if(imagePaths.length){
        resolve(imagePaths);
      } else {
        reject(new Error("No slices found, are they in format 'slice_xxxx.png'?"));
      }
    });
  });
}

const commonChannel=new event();
commonChannel.on("progress",(data)=>{
  console.log(data);
});

loadDirectory(path,commonChannel).then(bvc=>{
  console.log("cube loaded!");
  exportImages(bvc,path+'/export',commonChannel).then(()=>{
    console.log('done');
  });
});
