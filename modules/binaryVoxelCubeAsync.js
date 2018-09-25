const bitArray = require('bit-array');
const event = require('./event');

function BinaryVoxelCube(sizeX,sizeY,sizeZ,pixels,boundingBox=null,channel=null){
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
      state:"start"
    });
    this.type='BinaryVoxelCube';
    this.sizeX=sizeX;
    this.sizeY=sizeY;
    this.sizeZ=sizeZ;
    if(sizeX*sizeY*sizeZ !== pixels.length){
      this.channel.emit("progress",{
        method:"constrfuctor",
        message:"voxel data does not match dimensions",
        percent:100,
        state:"error"
      });
      reject(new Error('voxel data does not match dimensions'));
    }
    this.channel.emit("progress",{
      method:"constructor",
      message:"loading voxel data...",
      percent:10,
      state:"pending"
    });
    try{
      this.voxelData=new bitArray(sizeX*sizeY*sizeZ);
      this.voxelData=pixels.copy();
      this.channel.emit("progress",{
        method:"constructor",
        message:"voxel data loaded",
        percent:75,
        state:"pending"
      });
    } catch (err){
      this.channel.emit("progress",{
        method:"constructor",
        message:"voxel data cannot be loaded",
        percent:100,
        state:"error"
      });
      reject(err);
    }
    this.channel.emit("progress",{
      method:"constructor",
      message:"refreshing bounding box...",
      percent:75,
      state:"pending"
    });
    if(boundingBox){
      this.boundingBox=boundingBox;
      this.channel.emit("progress",{
        method:"constructor",
        message:"custom bounding box used, voxel cube initialised.",
        percent:100,
        state:"end"
      });
      resolve(this);
    } else {
      this.refreshBoundingBox().then(()=>{
        this.channel.emit("progress",{
          method:"constructor",
          message:"bounding box refreshed, voxel cube initialised.",
          percent:100,
          state:"end"
        });
        console.log("first refreshed bounding box",this.boundingBox);
        resolve(this);
      }).catch((err)=>{
        this.channel.emit("progress",{
          method:"constructor",
          message:"bounding box cannot be refreshed",
          percent:100,
          state:"error"
        });
        reject(err);
      });
    }
  });
};

BinaryVoxelCube.prototype.getVoxel = function(x,y,z){
  if(z<0){
    return false;
  } else if(x<0 || y<0 || x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ) {
    return false;
  }
  return this.voxelData.get(this.sizeX*this.sizeY*z+this.sizeX*y+x);
}

BinaryVoxelCube.prototype.setVoxel = function(x,y,z,color){
  if(z<0 || x<0 || y<0 || x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ) {
    return false;
  }
  this.voxelData.set(this.sizeX*this.sizeY*z+this.sizeX*y+x,color);
}

BinaryVoxelCube.prototype.getLayer = function(z){
  return new Promise((resolve, reject)=>{
    sizeXY=this.sizeX*this.sizeY;
    let ret=new bitArray(sizeXY);
    for(let i=0;i<sizeXY;i++){
      ret.set(i,this.voxelData.get((z-1)*sizeXY+i));
    }
    resolve(ret);
  });
}

BinaryVoxelCube.prototype.volume = function(){
  return this.voxelData.count();
}

BinaryVoxelCube.prototype.coordsToIndex = function(x,y,z){
  console.log('z: '+z+'x'+this.sizeY+'x'+this.sizeX+'='+(z*this.sizeY*this.sizeX));
  console.log('y: '+y+'x'+this.sizeX+'='+(y*this.sizeX));
  console.log('x: '+x);
  console.log('=:'+(z*this.sizeY*this.sizeX+y*this.sizeX+x));
  return z*this.sizeY*this.sizeX+y*this.sizeX+x;
}

BinaryVoxelCube.prototype.refreshBoundingBox = function(){
  return new Promise((resolve,reject) => {
    this.boundingBox={
      left:this.sizeX-1,
      right:0,
      front:this.sizeY-1,
      back:0,
      bottom:this.sizeZ-1,
      top:0
    }
    const percent=Math.floor(this.sizeX*this.sizeY*this.sizeZ/100);
    let processed=0;
    for(let z=0;z<this.sizeZ;z++){
      for(let y=0;y<this.sizeY;y++){
        for(let x=0;x<this.sizeX;x++){
          processed++;
          if(/*z>this.boundingBox.bottom || z<this.boundingBox.top || y>this.boundingBox.front || y<this.boundingBox.back || x>this.boundingBox.left || x<this.boundingBox.right*/false){
            //idle
          } else {
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'refreshBoundingBox',
                message:"calibrating bounding box",
                percent:processed/percent,
                state:"pending"
              });
            }
            let value=this.getVoxel(x,y,z);
            if(x<this.boundingBox.left){
              if(value){
                this.boundingBox.left=x;
              }
            }

            if(x>this.boundingBox.right){
              if(value){
                this.boundingBox.right=x;
              }
            }

            if(y<this.boundingBox.front){
              if(value){
                this.boundingBox.front=y;
              }
            }

            if(y>this.boundingBox.back){
              if(value){
                this.boundingBox.back=y;
              }
            }

            if(z<this.boundingBox.bottom){
              if(value){
                this.boundingBox.bottom=z;
              }
            }

            if(z>this.boundingBox.top){
              if(value){
                this.boundingBox.top=z;
              }
            }
          }
        }
      }
    }
    this.channel.emit("progress",{
      method:'refreshBoundingBox',
      message:"bounding box calibrated",
      percent:100,
      state:"end"
    });
    resolve();
  });
}

BinaryVoxelCube.prototype.booleanAdd = function(bvc){ //another binary voxel cube
  let percent;
  let processed;
  this.channel.emit("progress",{
    method:'booleanAdd',
    message:"boolean add start",
    percent:0,
    state:"start"
  });
  return new Promise((resolve, reject)=>{
    if(bvc.type=='BinaryVoxelPattern'){
      this.channel.emit("progress",{
        method:"booleanAdd",
        message:"do not use boolean add with infinite patterns!",
        percent:100,
        state:"error"
      });
      throw new Error('do not use boolean add with infinite patterns! cut part of them with intersect first!');
    }
    if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
      this.channel.emit("progress",{
        method:"booleanAdd",
        message:"cubes have different profile!",
        percent:100,
        state:"error"
      });
      throw new Error('cubes have different profile!');
    }
    let originalIsTaller=!!bvc.size<this.sizeZ;
    //let size=this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ;
    let minZ=(originalIsTaller?bvc:this).sizeZ;
    let combinedData=new bitArray(this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ);
    let boundingBox={
      left:Math.min(this.boundingBox.left,bvc.boundingBox.left),
      right:Math.max(this.boundingBox.right,bvc.boundingBox.right),
      front:Math.min(this.boundingBox.front,bvc.boundingBox.front),
      back:Math.max(this.boundingBox.back,bvc.boundingBox.back),
      bottom:Math.min(this.boundingBox.bottom,bvc.boundingBox.bottom),
      top:Math.max(this.boundingBox.top,bvc.boundingBox.top)
    }
    percent=Math.round((boundingBox.right-boundingBox.left+1)*(boundingBox.back-boundingBox.front+1)*(boundingBox.top-boundingBox.bottom+1)/100);
    processed=0;
    for(let z=boundingBox.bottom;z<=boundingBox.top;z++){
      for(let y=boundingBox.front;y<=boundingBox.back;y++){
        for(let x=boundingBox.left;x<=boundingBox.right;x++){
          processed++;
          if(!(processed%percent)){
            this.channel.emit("progress",{
              method:'booleanAdd',
              message:"combining (boolean add)...",
              percent:processed/percent,
              state:"pending"
            });
          }
          let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
          if(z<minZ){
            combinedData.set(idx,(this.voxelData.get(idx)||bvc.voxelData.get(idx)))
          } else {
            if(originalIsTaller){
              combinedData.set(idx,this.voxelData.get(idx));
            } else {
              combinedData.set(idx,bvc.voxelData.get(idx));
            }
          }
        }
      }
    }

    this.channel.emit("progress",{
      method:'booleanAdd',
      message:"boolean add finished",
      percent:100,
      state:"end"
    });
    resolve(new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData,boundingBox,this.channel));
  });
}

BinaryVoxelCube.prototype.booleanIntersect = function(bvc){ //another binary voxel cube
  let percent;
  let processed;

  this.channel.emit("progress",{
    method:'booleanIntersect',
    message:"boolean intersect start",
    percent:0,
    state:"start"
  });
  return new Promise((resolve,reject)=>{
    if(bvc.type=='BinaryVoxelPattern'){
      let combinedData=new bitArray(this.sizeX*this.sizeY*this.sizeZ);
      percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
      processed=0;

      for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z++){
        for(let y=this.boundingBox.front;y<=this.boundingBox.back;y++){
          for(let x=this.boundingBox.left;x<=this.boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'booleanIntersect',
                message:"combining (boolean intersect)...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
            combinedData.set(idx,(this.getVoxel(x,y,z)&&bvc.getVoxel(x,y,z)))
          }
        }
      }
      this.channel.emit("progress",{
        method:'booleanIntersect',
        message:"boolean intersect finished",
        percent:100,
        state:"end"
      });
      resolve(new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,combinedData,this.boundingBox,this.channel));
    } else {
      if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
        this.channel.emit("progress",{
          method:'booleanIntersect',
          message:"cubes have different profile!",
          percent:100,
          state:"error"
        });
        reject(new Error('cubes have different profile!'));
      }
      let originalIsTaller=!!bvc.size<this.sizeZ;
      //let size=this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ;
      let minZ=(originalIsTaller?bvc:this).sizeZ;
      let combinedData=new bitArray(this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ);
      let boundingBox={
        left:Math.max(this.boundingBox.left,bvc.boundingBox.left),
        right:Math.min(this.boundingBox.right,bvc.boundingBox.right),
        front:Math.max(this.boundingBox.front,bvc.boundingBox.front),
        back:Math.min(this.boundingBox.back,bvc.boundingBox.back),
        bottom:Math.max(this.boundingBox.bottom,bvc.boundingBox.bottom),
        top:Math.min(this.boundingBox.top,bvc.boundingBox.top)
      }
      percent=Math.round((boundingBox.right-boundingBox.left+1)*(boundingBox.back-boundingBox.front+1)*(boundingBox.top-boundingBox.bottom+1)/100);
      processed=0;
      for(let z=boundingBox.bottom;z<boundingBox.top;z++){
        for(let y=boundingBox.front;y<boundingBox.back;y++){
          for(let x=boundingBox.left;x<boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'booleanIntersect',
                message:"combining (boolean add)...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
            if(z<minZ){
              combinedData.set(idx,(this.voxelData.get(idx)&&bvc.voxelData.get(idx)))
            } else {
              combinedData.set(idx,false);
            }
          }
        }
      }
      this.channel.emit("progress",{
        method:'booleanIntersect',
        message:"boolean intersect finished",
        percent:100,
        state:"end"
      });
      resolve(new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData,boundingBox,this.channel));
    }
  })
}

BinaryVoxelCube.prototype.booleanDifference = function(bvc){ //another binary voxel cube
  let percent;
  let processed;

  this.channel.emit("progress",{
    method:'booleanDifference',
    message:"boolean difference start",
    percent:0,
    state:"start"
  });
  return new Promise((resolve,reject)=>{
    if(bvc.type=='BinaryVoxelPattern'){ //this hack allows to use patterns, it is even much simpler than standard case
      percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
      processed=0;
      let combinedData=new bitArray(this.sizeX*this.sizeY*this.sizeZ);
      for(let z=this.boundingBox.bottom;z<this.boundingBox.top;z++){
        for(let y=this.boundingBox.front;y<this.boundingBox.back;y++){
          for(let x=this.boundingBox.left;x<this.boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'booleanDifference',
                message:"combining (boolean difference)...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
            combinedData.set(idx,this.getVoxel(x,y,z)&&!bvc.getVoxel(x,y,z));
          }
        }
      }

      resolve(new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,combinedData,this.boundingBox,this.channel));
    } else {
      if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
        this.channel.emit("progress",{
          method:'booleanDifference',
          message:"cubes have different profile!",
          percent:100,
          state:"error"
        });
        reject(new Error('cubes have different profile!'));
      }
      let originalIsTaller=!!bvc.size<this.sizeZ;
      //let size=this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ;
      let minZ=(originalIsTaller?bvc:this).sizeZ;
      let combinedData=new bitArray(this.sizeX*this.sizeY*(originalIsTaller?this:bvc).sizeZ);
      let boundingBox=this.boundingBox
      percent=Math.round((boundingBox.right-boundingBox.left+1)*(boundingBox.back-boundingBox.front+1)*(boundingBox.top-boundingBox.bottom+1)/100);
      processed=0;
      for(let z=boundingBox.bottom;z<boundingBox.top;z++){
        for(let y=boundingBox.front;y<boundingBox.back;y++){
          for(let x=boundingBox.left;x<boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'booleanDifference',
                message:"combining (boolean difference)...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
            if(z<minZ){
              if(bvc.voxelData.get(idx)){
                combinedData.set(idx,false);
              } else {
                combinedData.set(idx,this.voxelData.get(idx))
              }
            } else {
              if(originalIsTaller){
                combinedData.set(idx,this.voxelData.get(idx));
              } else {
                combinedData.set(idx,false);
              }
            }
          }
        }
      }
      this.channel.emit("progress",{
        method:'booleanDifference',
        message:"boolean difference finished",
        percent:100,
        state:"end"
      });

      resolve(new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData,boundingBox,this.channel));
    }
  });
}

BinaryVoxelCube.prototype.booleanInversion = function(){
  return new Promise((resolve,reject)=>{
    this.channel.emit("progress",{
      method:'booleanInversion',
      message:"boolean inversion does not show progress, be patient",
      percent:10,
      state:"start"
    });
    const ret=new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,this.voxelData.not(),this.boundingBox,this.channel);
    this.channel.emit("progress",{
      method:'booleanInversion',
      message:"boolean inversion finished",
      percent:100,
      state:"end"
    });
    resolve(ret);
  });
}

BinaryVoxelCube.prototype.translate = function(dx,dy,dz){
  this.channel.emit("progress",{
    method:'translate',
    message:"translate start",
    percent:0,
    state:"start"
  });
  return new Promise((resolve,reject)=>{
    const percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
    let processed=0;
    new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,new bitArray(this.sizeX*this.sizeY*this.sizeZ),this.boundingBox,this.channel).then(ret=>{
      for(let z=this.boundingBox.bottom;z<this.boundingBox.top;z++){
        for(let y=this.boundingBox.front;y<this.boundingBox.back;y++){
          for(let x=this.boundingBox.left;x<this.boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'translate',
                message:"translating...",
                percent:processed/percent,
                state:"pending"
              });
            }
            ret.setVoxel(x+dx,y+dy,z+dz,this.getVoxel(x,y,z));
          }
        }
      }
      ret.boundingBox={
        left:Math.min(this.boundingBox.left+dx,0),
        right:Math.max(this.boundingBox.right+dx,this.sizeX-1),
        front:Math.min(this.boundingBox.front+dx,0),
        back:Math.max(this.boundingBox.back+dy,this.sizeY-1),
        bottom:Math.min(this.boundingBox.bottom+dx,0),
        top:Math.max(this.boundingBox.top+dx,this.sizeZ-1),
      };
      this.channel.emit("progress",{
        method:'translate',
        message:"translation finished",
        percent:100,
        state:"end"
      });
      resolve(ret);
    });
  });
}

BinaryVoxelCube.prototype.erode = function(r=1,scale=0, smooth=false){
  const channel=this.channel;
  channel.emit("progress",{
    method:'erode',
    message:"erosion starts...",
    percent:0,
    state:"start"
  });
  return new Promise((resolveAll, reject)=>{
    new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ, this.voxelData.copy(),this.boundingBox, this.channel).then((work)=>{
      function applyScaleDown(pro){
        return new Promise((resolve,reject)=>{
          pro.then((obj)=>{
            channel.emit("progress",{
              method:'erode',
              message:"scaling down...",
              percent:10,
              state:"pending"
            });
            resolve(obj.scaleDown(smooth));
          });
        });
      }

      counter=0;
      let scaled=new Promise((resolve,reject)=>{
        resolve(work);
      });
      while(counter<scale){
        counter++;
        scaled=applyScaleDown(scaled);
      }

      scaled.then((scaledWork)=>{
        new BinaryVoxelCube(scaledWork.sizeX,scaledWork.sizeY,scaledWork.sizeZ, new bitArray(scaledWork.sizeX*scaledWork.sizeY*scaledWork.sizeZ),scaledWork.boundingBox,channel).then((ret)=>{
          function isInside(obj,x,y,z){
            if(!obj.getVoxel(x,y,z)){
              return false;
            }
            if(!obj.getVoxel(x-1,y,z)){
              return false;
            } else if(!obj.getVoxel(x+1,y,z)){
              return false;
            } else if(!obj.getVoxel(x,y-1,z)){
              return false;
            } else if(!obj.getVoxel(x,y+1,z)){
              return false;
            } else if(!obj.getVoxel(x,y,z-1)){
              return false;
            } else if(!obj.getVoxel(x,y,z+1)){
              return false;
            }
            return true;
          }
          for(let i=0;i<r;i++){
            channel.emit("progress",{
              method:'erode',
              message:"cycles...",
              percent:Math.round(i/r*80)+10,
              state:"pending"
            });
            let percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
            //let percent=1000;
            let processed=0;
            channel.emit("progress",{
              method:'erodeCycle',
              message:"erode cycle no."+(i+1),
              percent:0,
              state:"start"
            });
            for(let z=scaledWork.boundingBox.bottom;z<=scaledWork.boundingBox.top;z++){
              for(let y=scaledWork.boundingBox.front;y<=scaledWork.boundingBox.back;y++){
                for(let x=scaledWork.boundingBox.left;x<=scaledWork.boundingBox.right;x++){
                  processed++;
                  if(!(processed%percent)){
                    channel.emit("progress",{
                      method:'erodeCycle',
                      message:"erode cycle no."+(i+1),
                      percent:processed/percent,
                      state:"pending"
                    });
                  }
                  ret.setVoxel(x,y,z,isInside(scaledWork,x,y,z));
                }
              }
            }
            channel.emit("progress",{
              method:'erodeCycle',
              message:"erode cycle no."+(i+1),
              percent:100,
              state:"end"
            });
            scaledWork.voxelData=ret.voxelData;
            //scaledWork.refreshBoundingBox();
            ret.voxelData=new bitArray(work.sizeX*work.sizeY*work.sizeZ);
          }

          function applyScaleUp(pro){
            return new Promise((resolve,reject)=>{
              pro.then((obj)=>{
                console.log("scale up cycle"+obj.volume());
                resolve(obj.scaleUp(smooth));
              });
            });
          }

          counter=0;
          scaled=new Promise((resolve,reject)=>{
            resolve(scaledWork);
          });
          while(counter<scale){
            counter++;
            channel.emit("progress",{
              method:'erode',
              message:"scaling up...",
              percent:90,
              state:"pending"
            });
            scaled=applyScaleUp(scaled);
          }

          scaled.then((scaledUp) => {
            channel.emit("progress",{
              method:'erode',
              message:"erode finished...",
              percent:100,
              state:"end"
            });
            resolveAll(scaledUp);
          });
        });
      });
    });
  });
}



BinaryVoxelCube.prototype.erodeDirectional = function(r={x:1, y:1, z:1},scale=0, smooth=false){
  const channel=this.channel;
  channel.emit("progress",{
    method:'erode',
    message:"erosion starts...",
    percent:0,
    state:"start"
  });
  return new Promise((resolveAll, reject)=>{
    new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ, this.voxelData.copy(),this.boundingBox, this.channel).then((work)=>{
      function applyScaleDown(pro){
        return new Promise((resolve,reject)=>{
          pro.then((obj)=>{
            channel.emit("progress",{
              method:'erode',
              message:"scaling down...",
              percent:10,
              state:"pending"
            });
            resolve(obj.scaleDown(smooth));
          });
        });
      }

      counter=0;
      let scaled=new Promise((resolve,reject)=>{
        resolve(work);
      });
      while(counter<scale){
        counter++;
        scaled=applyScaleDown(scaled);
      }

      scaled.then((scaledWork)=>{
        new BinaryVoxelCube(scaledWork.sizeX,scaledWork.sizeY,scaledWork.sizeZ, new bitArray(scaledWork.sizeX*scaledWork.sizeY*scaledWork.sizeZ),scaledWork.boundingBox,channel).then((ret)=>{
          function isInside(obj,x,y,z,direction){
            if(!obj.getVoxel(x,y,z)){
              return false;
            }
            if(!obj.getVoxel(x-1,y,z) && direction=='x'){
              return false;
            } else if(!obj.getVoxel(x+1,y,z) && direction=='x'){
              return false;
            } else if(!obj.getVoxel(x,y-1,z) && direction=='y'){
              return false;
            } else if(!obj.getVoxel(x,y+1,z) && direction=='y'){
              return false;
            } else if(!obj.getVoxel(x,y,z-1) && direction=='z'){
              return false;
            } else if(!obj.getVoxel(x,y,z+1) && direction=='z'){
              return false;
            }
            return true;
          }
          r.x=parseInt(r.x);
          r.y=parseInt(r.y);
          r.z=parseInt(r.z);

          const cycles=r.x+r.y+r.z;
          let cycleCounter=0;
          while(r.x+r.y+r.z>0){
            cycleCounter++;
            let direction='x';
            for(idx in r){
              if(r[idx]>r[direction]){
                direction=idx;
              }
            }
            r[direction]--;
            channel.emit("progress",{
              method:'erode',
              message:"cycles...",
              percent:Math.round(((cycleCounter-1)/cycles)*80)+10,
              state:"pending"
            });
            channel.emit("progress",{
              method:'erodeCycle',
              message:"Startin cycle no."+cycleCounter+" in "+direction+"-axis",
              percent:10,
              state:"pending"
            });
            let percent=Math.round((scaledWork.boundingBox.right-scaledWork.boundingBox.left+1)*(scaledWork.boundingBox.back-scaledWork.boundingBox.front+1)*(scaledWork.boundingBox.top-scaledWork.boundingBox.bottom+1)/100);
            //let percent=1000;
            let processed=0;
            channel.emit("progress",{
              method:'erodeCycle',
              message:"erode cycle no."+cycleCounter+"/"+cycles,
              percent:0,
              state:"start"
            });
            for(let z=scaledWork.boundingBox.bottom;z<=scaledWork.boundingBox.top;z++){
              for(let y=scaledWork.boundingBox.front;y<=scaledWork.boundingBox.back;y++){
                for(let x=scaledWork.boundingBox.left;x<=scaledWork.boundingBox.right;x++){
                  processed++;
                  if(!(processed%percent)){
                    channel.emit("progress",{
                      method:'erodeCycle',
                      message:"erode cycle no."+cycleCounter+"/"+cycles,
                      percent:processed/percent,
                      state:"pending"
                    });
                  }
                  //console.log('x:'+x+'y:'+y+'z:'+z);
                  ret.setVoxel(x,y,z,isInside(scaledWork,x,y,z,direction));
                }
              }
            }
            channel.emit("progress",{
              method:'erodeCycle',
              message:"erode cycle no."+cycleCounter,
              percent:100,
              state:"end"
            });
            scaledWork.voxelData=ret.voxelData;
            //scaledWork.refreshBoundingBox();
            ret.voxelData=new bitArray(work.sizeX*work.sizeY*work.sizeZ);
          }

          function applyScaleUp(pro){
            return new Promise((resolve,reject)=>{
              pro.then((obj)=>{
                console.log("scale up cycle"+obj.volume());
                resolve(obj.scaleUp(smooth));
              });
            });
          }

          counter=0;
          scaled=new Promise((resolve,reject)=>{
            resolve(scaledWork);
          });
          while(counter<scale){
            counter++;
            channel.emit("progress",{
              method:'erode',
              message:"scaling up...",
              percent:90,
              state:"pending"
            });
            scaled=applyScaleUp(scaled);
          }

          scaled.then((scaledUp) => {
            channel.emit("progress",{
              method:'erode',
              message:"erode finished...",
              percent:100,
              state:"end"
            });
            resolveAll(scaledUp);
          });
        });
      });
    });
  });
}

BinaryVoxelCube.prototype.scaleDown = function(smooth=false){
  return new Promise((resolve,reject)=>{
    const percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/800);
    let processed=0;
    new BinaryVoxelCube(this.sizeX >> 1,this.sizeY >> 1,this.sizeZ >> 1,new bitArray((this.sizeX >> 1)*(this.sizeY >> 1)*(this.sizeZ >> 1)),this.boundingBox,this.channel).then((ret)=>{
      ret.originalResolution=this.originalResolution||[];
      ret.originalResolution.push({
        x:this.sizeX,
        y:this.sizeY,
        z:this.sizeZ,
        left:this.boundingBox.left,
        right:this.boundingBox.right,
        front:this.boundingBox.front,
        back:this.boundingBox.back,
        bottom:this.boundingBox.bottom,
        top:this.boundingBox.top
      });

      this.channel.emit("progress",{
        method:'scaleDown',
        message:"scale down start",
        percent:0,
        state:"start"
      });
      for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z+=2){
        for(let y=this.boundingBox.front;y<=this.boundingBox.back;y+=2){
          for(let x=this.boundingBox.left;x<=this.boundingBox.right;x+=2){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'scaleDown',
                message:"scaling down...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let val;
            if(smooth){
              val=Math.round((
                this.getVoxel(x,y,z)
                +this.getVoxel(x+1,y,z)
                +this.getVoxel(x,y+1,z)
                +this.getVoxel(x+1,y+1,z)
                +this.getVoxel(x,y,z+1)
                +this.getVoxel(x+1,y,z+1)
                +this.getVoxel(x,y+1,z+1)
                +this.getVoxel(x+1,y+1,z+1))/8);
            } else {
              val=this.getVoxel(x,y,z)
            }
            ret.setVoxel(x >> 1, y >> 1, z >> 1, val);
          }
        }
      }
      ret.boundingBox={
        left:this.boundingBox.left >> 1,
        right:this.boundingBox.right >> 1,
        front:this.boundingBox.front >> 1,
        back:this.boundingBox.back >> 1,
        bottom:this.boundingBox.bottom >> 1,
        top:this.boundingBox.top >> 1,
      }
      this.channel.emit("progress",{
        method:'scaleDown',
        message:"scaling down finished",
        percent:100,
        state:"end"
      });
      resolve(ret);
    });
  });
}

BinaryVoxelCube.prototype.scaleUp = function(smooth=false,additive=true){
  return new Promise((resolve,reject)=>{
    const percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
    let processed=0;
    let prom;
    if(this.originalResolution && this.originalResolution.length){
      let res=this.originalResolution.pop();
      prom=new BinaryVoxelCube(res.x,res.y,res.z,new bitArray(res.x*res.y*res.z),{
        left:res.left,
        right:res.right,
        front:res.front,
        back:res.back,
        bottom:res.bottom,
        top:res.top
      },this.channel);
    } else {
      prom=new BinaryVoxelCube(this.sizeX << 1,this.sizeY << 1,this.sizeZ << 1,new bitArray((this.sizeX*this.sizeY*this.sizeZ)<<3),{
        left:this.boundingBox.left,
        right:this.boundingBox.right,
        front:this.boundingBox.front,
        back:this.boundingBox.back,
        bottom:this.boundingBox.bottom,
        top:this.boundingBox.top
      },this.channel);
    }
    prom.then((ret)=>{
      const self=this;

      function addVoxel(x,y,z,val){
        ret.setVoxel(x*2,y*2,z*2,val);
        ret.setVoxel(x*2+1,y*2,z*2,val);
        ret.setVoxel(x*2+1,y*2+1,z*2,val);
        ret.setVoxel(x*2+1,y*2,z*2+1,val);
        ret.setVoxel(x*2+1,y*2+1,z*2+1,val);
        ret.setVoxel(x*2,y*2+1,z*2,val);
        ret.setVoxel(x*2,y*2+1,z*2+1,val);
        ret.setVoxel(x*2,y*2,z*2+1,val);
      }

      function addVoxelSmooth(x,y,z,val){
        if(additive){
          if (!val) {
            addVoxel(x,y,z,val);
            return;
          }
        } else {
          if (val) {
            addVoxel(x,y,z,val);
            return;
          }
        }

        let t=self.getVoxel(x,y,z+1)==val;
        let b=self.getVoxel(x,y,z-1)==val;
        let n=self.getVoxel(x,y+1,z)==val;
        let s=self.getVoxel(x,y-1,z)==val;
        let w=self.getVoxel(x-1,y,z)==val;
        let e=self.getVoxel(x+1,y,z)==val;

        ret.setVoxel(x*2,y*2+1,z*2+1,(t && n && w)?val:!val);

        ret.setVoxel(x*2+1,y*2+1,z*2+1,(t && n && e)?val:!val);

        ret.setVoxel(x*2,y*2,z*2+1,(t && s && w)?val:!val);

        ret.setVoxel(x*2+1,y*2,z*2+1,(t && s && e)?val:!val);

        ret.setVoxel(x*2,y*2+1,z*2,(b && n && w)?val:!val);

        ret.setVoxel(x*2+1,y*2+1,z*2,(b && n && e)?val:!val);

        ret.setVoxel(x*2,y*2,z*2,(b && s && w)?val:!val);

        ret.setVoxel(x*2+1,y*2,z*2,(b && s && e)?val:!val);
      }
      this.channel.emit("progress",{
        method:'scaleUp',
        message:"scale up start",
        percent:0,
        state:"start"
      });
      for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z++){
        for(let y=this.boundingBox.front;y<=this.boundingBox.back;y++){
          for(let x=this.boundingBox.left;x<=this.boundingBox.right;x++){
            processed++;
            if(!(processed%percent)){
              this.channel.emit("progress",{
                method:'scaleUp',
                message:"scaling up...",
                percent:processed/percent,
                state:"pending"
              });
            }
            let val=this.getVoxel(x,y,z);
            if(smooth){
              addVoxelSmooth(x,y,z,val);
            } else {
              addVoxel(x,y,z,val);
            }
          }
        }
      }

      ret.originalResolution=this.originalResolution;
      //ret.refreshBoundingBox();
      this.channel.emit("progress",{
        method:'scaleUp',
        message:"scaling up finished",
        percent:100,
        state:"end"
      });
      resolve(ret);
    })
  });
}

BinaryVoxelCube.prototype.dilate = function(r=1, scale=0, smooth=false){
  const channel=this.channel;
  channel.emit("progress",{
    method:'dilate',
    message:"dilate starts...",
    percent:0,
    state:"start"
  });
  console.log("before promise",this.boundingBox);
  return new Promise((resolveAll, reject)=>{
    console.log("inside promise");
    new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ, this.voxelData.copy(),this.boundingBox, this.channel).then((work)=>{
      console.log("new instance", work.volume());
      function applyScaleDown(pro){
        return new Promise((resolve,reject)=>{
          pro.then((obj)=>{
            channel.emit("progress",{
              method:'erode',
              message:"scaling down...",
              percent:10,
              state:"pending"
            });
            console.log("scale down cycle"+obj.volume());
            resolve(obj.scaleDown(smooth));
          });
        });
      }

      counter=0;
      let scaled=new Promise((resolve,reject)=>{
        resolve(work);
      });
      while(counter<scale){
        counter++;
        scaled=applyScaleDown(scaled);
      }

      scaled.then((scaledWork)=>{
        console.log("eroding",scaledWork.volume());
        let bigerBox={
          left:Math.max(0,scaledWork.boundingBox.left-r),
          right:Math.min(scaledWork.sizeX,scaledWork.boundingBox.right+r),
          front:Math.max(0,scaledWork.boundingBox.front-r),
          back:Math.min(scaledWork.sizeY,scaledWork.boundingBox.back+r),
          bottom:Math.max(0,scaledWork.boundingBox.bottom-r),
          top:Math.min(scaledWork.sizeZ,scaledWork.boundingBox.top+r),
        }
        new BinaryVoxelCube(scaledWork.sizeX,scaledWork.sizeY,scaledWork.sizeZ, new bitArray(scaledWork.sizeX*scaledWork.sizeY*scaledWork.sizeZ),bigerBox,channel).then((ret)=>{
          function hasNeighbor(obj,x,y,z){
            if(obj.getVoxel(x-1,y,z)){
              return true;
            } else if(obj.getVoxel(x+1,y,z)){
              return true;
            } else if(obj.getVoxel(x,y-1,z)){
              return true;
            } else if(obj.getVoxel(x,y+1,z)){
              return true;
            } else if(obj.getVoxel(x,y,z-1)){
              return true;
            } else if(obj.getVoxel(x,y,z+1)){
              return true;
            }
            return false;
          }
          for(let i=0;i<r;i++){
            channel.emit("progress",{
              method:'dilate',
              message:"cycles...",
              percent:Math.round(i/r*80)+10,
              state:"pending"
            });
            let percent=Math.round((this.boundingBox.right-this.boundingBox.left+1)*(this.boundingBox.back-this.boundingBox.front+1)*(this.boundingBox.top-this.boundingBox.bottom+1)/100);
            //let percent=1000;
            let processed=0;
            channel.emit("progress",{
              method:'dilateCycle',
              message:"dilate cycle no."+(i+1),
              percent:0,
              state:"start"
            });
            for(let z=bigerBox.bottom;z<=bigerBox.top;z++){
              for(let y=bigerBox.front;y<=scaledWork.boundingBox.back;y++){
                for(let x=bigerBox.left;x<=bigerBox.right;x++){
                  processed++;
                  if(!(processed%percent)){
                    channel.emit("progress",{
                      method:'dilateCycle',
                      message:"dilate cycle no."+(i+1),
                      percent:processed/percent,
                      state:"pending"
                    });
                  }
                  ret.setVoxel(x,y,z,hasNeighbor(scaledWork,x,y,z));
                }
              }
            }
            channel.emit("progress",{
              method:'dilateCycle',
              message:"dilate cycle no."+(i+1),
              percent:100,
              state:"end"
            });
            scaledWork.voxelData=ret.voxelData;
            //scaledWork.refreshBoundingBox();
            ret.voxelData=new bitArray(work.sizeX*work.sizeY*work.sizeZ);
          }

          function applyScaleUp(pro){
            return new Promise((resolve,reject)=>{
              pro.then((obj)=>{
                console.log("scale up cycle"+obj.volume());
                resolve(obj.scaleUp(smooth));
              });
            });
          }

          counter=0;
          scaled=new Promise((resolve,reject)=>{
            resolve(scaledWork);
          });
          while(counter<scale){
            counter++;
            channel.emit("progress",{
              method:'dilate',
              message:"scaling up...",
              percent:90,
              state:"pending"
            });
            scaled=applyScaleUp(scaled);
          }

          scaled.then((scaledUp) => {
            channel.emit("progress",{
              method:'dilate',
              message:"dilate finished...",
              percent:100,
              state:"end"
            });
            resolveAll(scaledUp);
          });
        });
      });
    });
  });
}

BinaryVoxelCube.prototype.changeZ = function(change,relative=true){
  return new Promise((resolve,reject)=>{
    const finalZ=relative?(this.sizeZ+change):change;
    this.channel.emit("progress",{
      method:'changeZ',
      message:"new height is "+finalZ,
      percent:0,
      state:"start"
    });
    let counter=0;
    const percent=Math.round((Math.min(finalZ+1,this.boundingBox.top)-this.boundingBox.bottom)*(this.boundingBox.back-this.boundingBox.front)*(this.boundingBox.right-this.boundingBox.left)/100);
    new BinaryVoxelCube(this.sizeX,this.sizeY,finalZ,new bitArray(this.sizeX*this.sizeY*finalZ),boundingBox=this.boundingBox,this.channel).then(ret=>{
      for(z=this.boundingBox.bottom;z<Math.min(finalZ,this.boundingBox.top+1);z++){
        for(y=this.boundingBox.front;y<=this.boundingBox.back;y++){
          for(x=this.boundingBox.left;x<=this.boundingBox.right;x++){
            counter++;
            ret.setVoxel(x,y,z,this.getVoxel(x,y,z));
            if(!(counter%percent)){
              this.channel.emit("progress",{
                method:'changeZ',
                message:"changeZ in progress...",
                percent:counter/percent,
                state:"pending"
              });
            }
          }
        }
      }
      this.channel.emit("progress",{
        method:'changeZ',
        message:"changeZ fnished...",
        percent:100,
        state:"end"
      });
      ret.refreshBoundingBox().then(()=>{
        resolve(ret);
      });
    });
  });
}

//map is a array (on numbers 0-255), must have same dimensions as layer
BinaryVoxelCube.prototype.verticalMap = function(map, maxZ=10, minZ=0,inBox=true){
  return new Promise((resolve,reject)=>{
    this.channel.emit("progress",{
      method:'verticalMap',
      message:"vertical mapping started...",
      percent:0,
      state:"start"
    });
    new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,this.voxelData.copy(),boundingBox=this.boundingBox,this.channel).then(ret=>{
      this.channel.emit("progress",{
        method:'verticalMap',
        message:"voxel cube created...",
        percent:0,
        state:"pendng"
      });
      console.log(ret);
      ret.changeZ(maxZ).then(ret=>{
        this.channel.emit("progress",{
          method:'verticalMap',
          message:"size increased...",
          percent:0,
          state:"pendng"
        });

        const midpoint=(255/(maxZ-minZ))*((maxZ-minZ)/2+minZ);

        let percent;
        let counter=0;
        if(inBox){
          percent=Math.round((this.boundingBox.back-this.boundingBox.front)*(this.boundingBox.right-this.boundingBox.left)/100);
        } else {
          percent=Math.round(this.sizeX*this.sizeY/100);
        }
        const factor=(maxZ-minZ);
        for(let y=inBox?this.boundingBox.front:0;y<(inBox?(this.boundingBox.back+1):this.sizeY);y++){
          for(let x=inBox?this.boundingBox.left:0;x<(inBox?(this.boundingBox.right+1):this.sizeX);x++){
            counter++;
            if(map[y*this.sizeX+x]>=0){
              let thickness=Math.round(map[y*this.sizeX+x]/255*factor)+minZ;
              let z=inBox?this.boundingBox.top:this.sizeZ-1;
              while(!this.getVoxel(x,y,z)&&z>0){
                z--;
              }
              if(thickness>0){
                for(let i=0;i<thickness;i++){
                  ret.setVoxel(x,y,z+i,true);
                }
              } else {
                for(let i=0;i>thickness;i--){
                  if(z+i>=0){
                    ret.setVoxel(x,y,z+i,false);
                  }
                }
              }
            }
            if(!(counter%percent)){
              this.channel.emit("progress",{
                method:'verticalMap',
                message:"applying map projection...",
                inBox,
                position:[x,y],
                percent:counter/percent,
                state:"pendng"
              });
            }
          }
        }
        this.channel.emit("progress",{
          method:'verticalMap',
          message:"vertical map applied...",
          percent:100,
          state:"end"
        });
        resolve(ret);
      });
    });
  });
}

module.exports = BinaryVoxelCube;
