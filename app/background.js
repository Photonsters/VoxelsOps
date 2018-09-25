const fileLoader=require('../modules/loader.js');
const generators = require('../modules/generators.js')
const voxelCube=require('../modules/binaryVoxelCubeAsync.js');
const event=require('../modules/event.js');
const exportImages=require('../modules/exportImages.js');
const path=require('path');

process.send({
  message:'logMain',
  text:'child process alive'
});

function init(){
  let data=JSON.parse(process.argv[2]);
  log({
    message:'logMain',
    text:JSON.stringify(data,null,2)
  });

  preloadModel(data.path).then(()=>{
    gyroidInfill(data.radius, data.block, data.smooth, data.pattern, data.tolerance);
  });
}

function log(data){
  data.model=activeModel;
  process.send(data);
}

let models={};
let patterns={};
let activeModel="";
let gyroidLastPath="./export";

const infoChannel=new event();
infoChannel.on("progress",(data)=>{
  log(data);
});



function load(pathToFile,name=null){
  return new Promise((resolve,reject)=>{
    activeModel=name;
    let relativePath=path.relative(process.cwd(), pathToFile);
    if(!name){
      name=relativePath;
    }

    fileLoader.async(relativePath,infoChannel).then((photonFile)=>{
      new voxelCube(photonFile.header.resX,photonFile.header.resY,photonFile.layers.length,photonFile.voxels,null,infoChannel).then((model)=>{
        models[name]=model;
        resolve(models[name]);
      });
    });
  });
}

function get(name){
  return new Promise((resolve,reject)=>{
    activeModel=name;
    if(!models[name]){
      reject(new Error('there is no such object'));
    } else {
      resolve(models[name]);
    }
  });
}

function deleteModel(name){
  return new Promise((resolve,reject)=>{
    if(!models[name]){
      reject(new Error('there is no such object'));
    } else {
      delete models[name];
      resolve();
    }
  })
}

voxelCube.prototype.save = function(name=null){
  if(!name){
    name=activeModel;
  }
  activeModel=name;
  return new Promise((resolve,reject)=>{
    models[name]=this;
    resolve();
  });
}

function exportModel(model,directory){
  return new Promise((resolve,reject)=>{
    let relativePath=path.relative(process.cwd(), directory);

    exportImages(model,directory,infoChannel).then(()=>{
      resolve();
    });
  })
}

//gyroid infill generator specific
function preloadModel(modelPath){
  return new Promise((resolve,reject)=>{
    load(modelPath,'temp').then(model=>{
      gyroidLastPath=modelPath;
      resolve(model);
      console.log("model preloaded");
    });
  });
}

function generateGyroid(pattern=100,tolerance=0.15,name='gyroid'){
  return new Promise((resolve,reject)=>{
    generators.gyroid(pattern,tolerance,infoChannel).then(pattern => {
      patterns[name]=pattern;
      resolve(patterns[name]);
    });
  })
}

function gyroidInfill(radius, block, smooth, pattern, tolerance){
  get('temp').then(model => {
    console.log("model fetched",model.volume());
    model.erodeDirectional({x:radius,y:radius,z:0},block,smooth).then(model => {
      console.log("model eroded",model.volume());
      let eroded=model;
      model.save('gyroid_eroded').then(()=>{
        console.log("model saved as gyroid_eroded");
        generateGyroid(pattern,tolerance,"temp").then(gyroid => {
          console.log("gyroid pattern generated");
          gyroid.booleanIntersect(eroded).then(model=>{
            console.log("eroded and gyroid intersected",model.volume());
            let infill=model;
            get('temp').then(model=>{
              console.log("model loaded",model.volume());
              model.booleanDifference(eroded).then(model=>{
                console.log("model hollowed",model.volume());
                model.booleanAdd(infill).then(model => {
                  console.log("infill merged in",model.volume());
                  exportModel(model,gyroidLastPath.replace('.photon','.eroded')).then(()=>{
                    console.log("done...");
                  }).catch(err => {
                    throw new Error(err);
                  });
                }).catch(err => {
                  throw new Error(err);
                });
              }).catch(err => {
                throw new Error(err);
              });
            }).catch(err => {
              throw new Error(err);
            });
          }).catch(err => {
            throw new Error(err);
          });
        }).catch(err => {
          throw new Error(err);
        });
      }).catch(err => {
        throw new Error(err);
      });
    }).catch(err => {
      throw new Error(err);
    });
  }).catch(err => {
    throw new Error(err);
  });
}

init();
