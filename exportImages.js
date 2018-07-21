let fs = require('fs');
let PNG = require('pngjs').PNG;
let rimraf = require('rimraf');

async function savePng(width,height,bitData,filename){
  let png = new PNG({
    width: width,
    height: height,
    filterType: -1
  });

  for(let idx=0;idx<width*height*4;idx+=4){
    let value=bitData.get(idx/4)*255;
    png.data[idx  ] = value;
    png.data[idx+1] = value;
    png.data[idx+2] = value;
    png.data[idx+3] = 255;
  }

  var buffer = PNG.sync.write(png);
  fs.writeFileSync(filename, buffer);

  //png.pack().pipe(fs.createWriteStream(filename));
}

function leftpad(number,length){
  let ret=''+number;
  let zeroes=(length-((''+number).length));
  for(let i=0;i<zeroes;i++){
    ret='0'+ret;
  }
  return ret
}

async function exportCube(voxelCube,directory){
  rimraf.sync(directory);
  fs.mkdirSync(directory);
  for(let z=0;z<voxelCube.sizeZ;z++){
    console.log("saving layer number "+(z+1));
    await savePng(voxelCube.sizeX,voxelCube.sizeY,voxelCube.getLayer(z+1),directory+"/slice__"+leftpad((z+1),4)+".png");
  }
}

//savePng(4,4,[1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0],'./pngtest/slice__0000.png');

module.exports = exportCube;
