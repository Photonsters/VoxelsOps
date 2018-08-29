const bitArray = require('bit-array');
const BinaryVoxelCube=require('./binaryVoxelCube.js');

function BinaryVoxelPattern (sizeX,sizeY,sizeZ,pattern,channel=null) {
  if(channel){
    this.channel=channel;
  } else {
    this.channel=new event();
  }
  return new Promise((resolve, reject) => {
    this.channel.emit("progress",{
      method:"constructor",
      message:"testing data...",
      percent:0,
      state:"pending"
    });
    this.type='BinaryVoxelPattern';
    if(sizeX*sizeY*sizeZ !== pattern.length){
      this.channel.emit("progress",{
        method:"constructor",
        message:"voxel data does not match dimensions",
        percent:100,
        state:"error"
      });
      reject(new Error('voxel data does not match dimensions'));
    }
    this.sizeX=sizeX;
    this.sizeY=sizeY;
    this.sizeZ=sizeZ;
    this.voxelData=new bitArray(sizeX*sizeY*sizeZ);
    //copy voxel data into new variable to prevent overriding;
    this.voxelData=pattern.copy();
    this.boundingBox='mimic';
    this.channel.emit("progress",{
      method:"constructor",
      message:"pattern generated",
      percent:100,
      state:"done"
    });
    resolve(this);
  });
}

BinaryVoxelPattern.prototype = Object.create(BinaryVoxelCube.prototype);
BinaryVoxelPattern.prototype.constructor = BinaryVoxelPattern;
BinaryVoxelPattern.parent = BinaryVoxelPattern.prototype;

BinaryVoxelPattern.prototype.getVoxel = function(x,y,z){
  return this.voxelData.get(this.sizeX*this.sizeY*(z%this.sizeZ)+this.sizeX*(y%this.sizeY)+(x%this.sizeX));
}

BinaryVoxelPattern.prototype.setVoxel = function(x,y,z,color){
  return this.voxelData.set(this.sizeX*this.sizeY*(z%this.sizeZ)+this.sizeX*(y%this.sizeY)+(x%this.sizeX),color);
}

BinaryVoxelPattern.prototype.booleanIntersect = function(bvc){ //another binary voxel cube
  return new Promise((resolve,reject)=>{
    if(bvc.type=='BinaryVoxelCube'){
      this.channel.emit("progress",{
        method:"booleanIntersect",
        message:"booleanIntersect finished",
        percent:100,
        state:"done"
      });
      bvc.booleanIntersect(this).then(model => {
        resolve(model);
      })
    } else if(bvc.type=='BinaryVoxelPattern'){
      this.channel.emit("progress",{
        method:"booleanItersect",
        message:"TODO: pattern quantification",
        percent:100,
        state:"error"
      });
      reject(new Error('TODO: implement function quantification'));
    }
  });
}

BinaryVoxelPattern.prototype.booleanAdd = function(bvc){
  return new Promise((resolve,reject)=>{
    if(bvc.type=='BinaryVoxelCube'){
      this.channel.emit("progress",{
        method:"booleanAdd",
        message:"do not use boolean add with infinite patterns! cut part of them with intersect first!",
        percent:100,
        state:"error"
      });
      reject(new Error('do not use boolean add with infinite patterns! cut part of them with intersect first!'));
    } else if(bvc.type=='BinaryVoxelPattern'){
      this.channel.emit("progress",{
        method:"booleanAdd",
        message:"TODO: pattern quantification",
        percent:100,
        state:"error"
      });
      reject(new Error('TODO: pattern quantification'));
    }
  });
}

BinaryVoxelPattern.prototype.booleanDifference = function(bvc){ //another binary voxel cube
  return new Promise((resolve,reject)=>{
    if(bvc.type=='BinaryVoxelCube'){
      this.channel.emit("progress",{
        method:"booleanDiffference",
        message:"do not use boolean difference with infinite patterns! cut part of them with intersect first!",
        percent:100,
        state:"error"
      });
      reject(new Error('do not use boolean difference with infinite patterns! cut part of them with intersect first!'));
    } else if(bvc.type=='BinaryVoxelPattern'){
      this.channel.emit("progress",{
        method:"booleanDifference",
        message:"TODO: pattern quantification",
        percent:100,
        state:"error"
      });
      reject(new Error('TODO: pattern quantification'));
    }
  });
}

BinaryVoxelPattern.prototype.erode = function(r){
  return new Promise((resolve,reject)=>{
    const self=this;
    let old=this.voxelData.copy();

    function getVoxel(x,y,z){
      return old.get((z%self.sizeZ)*self.sizeX*self.sizeY+(y%self.sizeY)*self.sizeX+(x%self.sizeX));
    }

    function isInside(x,y,z){
      if(!getVoxel(x,y,z)){
        return false;
      }
      if(!getVoxel(x-1,y,z)){
        return false;
      } else if(!getVoxel(x+1,y,z)){
        return false;
      } else if(!getVoxel(x,y-1,z)){
        return false;
      } else if(!getVoxel(x,y+1,z)){
        return false;
      } else if(!getVoxel(x,y,z-1)){
        return false;
      } else if(!getVoxel(x,y,z+1)){
        return false;
      }
      return true;
    }
    let ret=new bitArray(this.sizeX*this.sizeY*this.sizeZ);
    for(let i=0;i<r;i++){
      console.log("erode cycle no. ",(i+1));
      for(let z=0;z<this.sizeZ.top;z++){
        for(let y=0;y<this.sizeY;y++){
          for(let x=0;x<this.sizeX;x++){
            ret.set(z*this.sizeY*this.sizeX+y*this.sizeX+x,isInside(x,y,z));
          }
        }
      }
      old=ret.copy();
    }

    resolve(new BinaryVoxelPattern(this.sizeX,this.sizeY,this.sizeZ,ret,this.channel));
  });
}

BinaryVoxelPattern.prototype.dilate = function(r){
  return new Promise((resolve,reject)=>{
    const self=this;
    let old=this.voxelData.copy();

    function getVoxel(x,y,z){
      return old.get((z%self.sizeZ)*self.sizeX*self.sizeY+(y%self.sizeY)*self.sizeX+(x%self.sizeZ));
    }

    function setVoxel(x,y,z,val){
      ret.set((z%self.sizeZ)*self.sizeX*self.sizeY+(y%self.sizeY)*self.sizeX+(x%self.sizeX),val);
    }

    function dilateVoxel(x,y,z){
      if(!getVoxel(x,y,z)) return;
      if(x-1>=0){
        setVoxel(x-1,y,z,true);
      }
      if(x+1<self.sizeX){
        setVoxel(x+1,y,z,true);
      }
      if(y-1>=0){
        setVoxel(x,y-1,z,true);
      }
      if(y+1<self.sizeY){
        setVoxel(x,y+1,z,true);
      }

      if(z-1>=0){
        setVoxel(x,y,z-1,true);
      }
      if(z+1<self.sizeZ){
        setVoxel(x,y,z+1,true);
      }
    }
    let ret=new bitArray(this.sizeX*this.sizeY*this.sizeZ);
    for(let i=0;i<r;i++){
      console.log("dilate cycle no. ",(i+1));
      for(let z=0;z<this.sizeZ;z++){
        for(let y=0;y<this.sizeY;y++){
          for(let x=0;x<this.sizeX;x++){
            dilateVoxel(x,y,z);
          }
        }
      }
      old=ret.copy();
    }

    resolve(new BinaryVoxelPattern(this.sizeX,this.sizeY,this.sizeZ,ret,this.channel));
  });
}

module.exports = BinaryVoxelPattern;
