let fs = require('fs');
let PNG = require('pngjs').PNG;
let rimraf = require('rimraf');
let event = require('./event.js');

function savePng(width,height,bitData,filename){
  return new Promise((resolve,reject) => {
    let png = new PNG({
      width: width,
      height: height,
      filterType: 2,
      colorType:2,
      bgColor: {
        red: 0,
        green: 0,
        blue: 0
      },
      inputHasAlpha: false
    });

    for(let idx=0;idx<width*height*3;idx+=3){
      let value=bitData.get(idx/3)*255;
      png.data[idx  ] = value;
      png.data[idx+1] = value;
      png.data[idx+2] = value;
    }

    let stream=fs.createWriteStream(filename);

    let pac=png.pack().pipe(stream).on('finish', function() {
      stream.close();
      resolve();
    });
  });
}

function leftpad(number,length){
  let ret=''+number;
  let zeroes=(length-((''+number).length));
  for(let i=0;i<zeroes;i++){
    ret='0'+ret;
  }
  return ret
}

function exportCube(voxelCube,directory,channel=null){
  this.channel=channel||new event();
  const self=this;
  return new Promise((resolve, reject)=>{
    rimraf.sync(directory);
    fs.mkdirSync(directory);

    function save(z){
      self.channel.emit("progress",{
        method:'saveLayer',
        message:"saving layer no. "+(z+1),
        percent:Math.round(z/voxelCube.sizeZ*100),
        state:"pending"
      });
      voxelCube.getLayer(z+1).then(layer => {
        savePng(voxelCube.sizeX,voxelCube.sizeY,layer,directory+"/slice__"+leftpad((z),4)+".png").then(()=>{
          if((z+1)<voxelCube.sizeZ){
            save(z+1);
          } else {
            self.channel.emit("progress",{
              method:'saveLayer',
              message:"export finished",
              percent:100,
              state:"end"
            });
            resolve();
          }
        });
      });
    }

    save(0);
  });
}

module.exports = exportCube;
