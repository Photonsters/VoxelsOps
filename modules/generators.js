const bitArray = require('bit-array');
const voxelPattern = require('./binaryVoxelPattern.js');

function gyroid(patternSize=100, tolerance=0.20,channel){
  return new Promise((resolve,reject)=>{
    const scale=3.19*(patternSize/20);
    const pat=new bitArray(patternSize*patternSize*patternSize);
    for(let z=0;z<patternSize;z++){
      for(let y=0;y<patternSize;y++){
        for(let x=0;x<patternSize;x++){
          let idx=z*patternSize*patternSize+y*patternSize+x;
          let gyro=Math.sin(x/scale)*Math.cos(y/scale)+Math.sin(y/scale)*Math.cos(z/scale)+Math.sin(z/scale)*Math.cos(x/scale);
          pat.set(idx,(gyro<tolerance && gyro>tolerance*(-1)));
        }
      }
    }

    resolve(new voxelPattern(patternSize,patternSize,patternSize,pat,channel));
  });
}

module.exports={
  gyroid
};
