const fileLoader=require('../../modules/loader.js');
const voxelCube=require('../../modules/binaryVoxelCubeAsync.js');
const bitArray = require('bit-array');
const fs=require('fs');
const exportImages=require('../../modules/exportImages.js');

module.exports=function(channel){
  return new Promise((resolve,reject)=>{
    data=fs.readFileSync('./app/resources/logo.bin','binary');
    console.log(data.length+"/"+589*517*82);
    voxelData=new bitArray(data.length);
    let counter=0;
    for(let i=0;i<data.length;i++){
      if(data[i]==1){
        counter++
      }
      voxelData.set(i,data[i]==1);
    }
    console.log("volume:"+counter);

    new voxelCube(589,517,82,voxelData).then((model)=>{
      exportImages(model,'./test').then(()=>{
        console.log("done")
      });
    }).catch(err=>{
      console.log(err);
    })
  })
}
