const fs = require('fs');
const PNG = require('pngjs').PNG;
const bitArray = require('bit-array');

function loadImage(filename){
  return new Promise((resolve,reject)=>{
    var data = fs.readFileSync(filename);
    var png = PNG.sync.read(data);

    resolve(png);
  })
}

function pngToArray(png){
  return new Promise((resolve,reject)=>{
    ret=[];
    for(let i=0;i<png.data.length;i=i+4){
      ret.push(parseInt(png.data[i]));
    }
    resolve(ret);
  });
}

function pngToBitArray(png,treshold){
  return new Promise((resolve,reject)=>{
    let ret=new bitArray(png.data.length/4);
    for(let i=0;i<png.data.length;i++){
      if(parseInt(png.data[i*4],16)===255){
        ret.set(i,true);
      } else if(parseInt(png.data[i*4],16)>0){
        if(treshold){
          ret.set(i,(parseInt(png.data[i*4],16)>=treshold));
        } else {
          reject(new Error('color cannot be converted without treshold'));
        }
      }
    }
    resolve(ret);
  });
}

module.exports={
  loadImage,
  pngToArray,
  pngToBitArray
}
