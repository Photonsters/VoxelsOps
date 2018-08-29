const fs=require('fs');
const bitArray = require('bit-array');
const event = require('./event');

function loadPhotonFile(d,channel=null) {
  let header = {
    bedSizeX: d.getFloat32(8, true),
    bedSizeY: d.getFloat32(12, true),
    bedSizeZ: d.getFloat32(16, true),
    layerThickness: d.getFloat32(32, true),
    exposureTime: d.getFloat32(36, true),
    bottomExposureTime: d.getFloat32(40, true),
    offTime: d.getFloat32(44, true),
    bottomLayers: d.getUint32(48, true),
    resX: d.getUint32(52, true),
    resY: d.getUint32(56, true),
    bigThumbOffset: d.getUint32(60, true),
    layersOffset: d.getUint32(64, true),
    layers: d.getUint32(68, true),
    smallThumbOffset: d.getUint32(72, true)
  };
  channel.emit("progress",{
    method:'loadPhotonFile',
    message:"loading photon file (0/"+header.layers*header.resX*header.resY+")",
    percent:0,
    state:"start"
  });

  //console.log(header);

  let layers = [];

  for (let i = 0; i < header.layers; ++i) {
    let o = header.layersOffset + i * 36;

    let layer = {
      position: d.getFloat32(o + 0, true),
      exposureTime: d.getFloat32(o + 4, true),
      offTime: d.getFloat32(o + 8, true),
      dataOffset: d.getUint32(o + 12, true),
      dataSize: d.getUint32(o + 16, true)
    };

    layers.push(layer);
  }

  return {
    fileDataView: d,
    header: header,
    layers: layers
  };
}

function getVoxels(photonFile, channel=null) {
  /*let dataArray = new ArrayBuffer(photonFile.header.resX * photonFile.header.resY * photonFile.layers.length);
  let dataArrayView = new Uint8Array(dataArray);*/
  const expectedVolume=photonFile.header.resX * photonFile.header.resY * photonFile.layers.length
  let voxelArray = new bitArray(expectedVolume);
  const step=Math.floor(expectedVolume/100);
  let totalVolume=0;
  let pixelIndex=0;
  for(let z=0;z<photonFile.layers.length;z++){
    let layer = photonFile.layers[z];
    let o = layer.dataOffset;
    let processedPixels = 0;
    let layerVolume=0;

    while (processedPixels < photonFile.header.resX * photonFile.header.resY) {
      let b = photonFile.fileDataView.getInt8(o++);
      let pixelCount = b;

      if (pixelCount < 0)
      {
        pixelCount = 128 + pixelCount;
        for (let i = 0; i < pixelCount; ++i) {
          //dataArrayView[(processedPixels + i)] = 1;
          voxelArray.set(pixelIndex, true);
          pixelIndex++;
          layerVolume++;
          totalVolume++;
          if(!(pixelIndex%step)){
            channel.emit("progress",{
              method:'loadPhotonFile',
              message:"loading photon file ("+totalVolume+"/"+expectedVolume+")",
              percent:pixelIndex/step,
              state:"pending"
            });
          }
        }
      } else {
        for (let i = 0; i < pixelCount; ++i) {
          //dataArrayView[(processedPixels + i)] = 0;
          voxelArray.set(pixelIndex, false);
          pixelIndex++;
          if(!(pixelIndex%step)){
            channel.emit("progress",{
              method:'loadPhotonFile',
              message:"loading photon file ("+totalVolume+"/"+expectedVolume+")",
              percent:pixelIndex/step,
              state:"pending"
            });
          }
        }
      }

      processedPixels += pixelCount;
    }
    //console.log('layer no.'+z+' volume:',layerVolume);
  }
  //console.log('total volume:',totalVolume);
  channel.emit("progress",{
    method:'loadPhotonFile',
    message:"photon file loaded",
    percent:100,
    state:"end"
  });
  return voxelArray;
}

function loadFile(filename){
  let photonFile = loadPhotonFile(new DataView(fs.readFileSync(filename,null).buffer));
  photonFile.voxels = getVoxels(photonFile);
  return photonFile;
}

function loadFileAsync(filename, channel=null){
  channel=channel||new event();
  return new Promise((resolve,reject) => {
    try {
      let photonFile = loadPhotonFile(new DataView(fs.readFileSync(filename,null).buffer), channel);
      photonFile.voxels = getVoxels(photonFile,channel);
      resolve(photonFile);
    } catch(e) {
      reject(e);
    }
  })
}

module.exports = {
  sync:loadFile,
  async:loadFileAsync
};
