const bitArray = require('bit-array');

function BinaryVoxelCube(sizeX,sizeY,sizeZ,pixels){
  if(sizeX*sizeY*sizeZ !== pixels.length){
    console.error('pixel do not match size');
    console.log("expected size:",sizeX*sizeY*sizeZ);
    console.log("real size:",pixels.length);
    return false;
  }
  this.sizeX=sizeX;
  this.sizeY=sizeY;
  this.sizeZ=sizeZ;
  this.voxelData=new bitArray(sizeX*sizeY*sizeZ);
  //copy voxel data into new variable to prevent overriding;
  this.voxelData=pixels.copy();
};

BinaryVoxelCube.prototype.getVoxel = function(x,y,z){
  if(z<0){
    return true;
  } else if(x<0 || y<0 || x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ) {
    return false;
  }
  return this.voxelData.get(this.sizeX*this.sizeY*z+this.sizeX*y+x);
}

BinaryVoxelCube.prototype.setVoxel = function(x,y,z,color){
  if(z<0 || x<0 || y<0 || x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ) {
    return false;
  }
  return this.voxelData.set(this.sizeX*this.sizeY*z+this.sizeX*y+x,color);
}

BinaryVoxelCube.prototype.renderLayer = function(z,scale=1){
  let render='';
  for(let y=0;y<this.sizeY;y+=scale){
    let line='';
    for(let x=0;x<this.sizeX;x+=scale){
      line+=(this.getVoxel(x,y,z)?'o':'.');
    }
    if(y==this.sizeY-1){
      render+=line;
    } else {
      render+=(line+'\n');
    }
  }
  return render;
}

BinaryVoxelCube.prototype.countLayerVolume = function(z){
  let total=0;
  for(let y=0;y<this.sizeY;y++){
    for(let x=0;x<this.sizeX;x++){
      total++;
    }
  }
  return total;
}

BinaryVoxelCube.prototype.floodOld = function(x,y,z,color,keepOldVoxel){
  if(z<0 || x<0 || y<0 || x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ) {
    return;
  }
  if(keepOldVoxel){
    ret=this;
  } else {
    ret=new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,this.voxelData);
  }
  if(ret.getVoxel(x,y,z-1)!=color){
    ret.flood(x,y,z-1,color,true);
  }
  if(ret.getVoxel(x,y,z+1)!=color){
    ret.flood(x,y,z+1,color,true);
  }
  ret.setVoxel(x,y,z,color);
  if(ret.getVoxel(x-1,y,z)!=color){
    ret.flood(x-1,y,z,color,true);
  }
  if(ret.getVoxel(x+1,y,z)!=color){
    ret.flood(x+1,y,z,color,true);
  }
  if(ret.getVoxel(x,y-1,z)!=color){
    ret.flood(x,y-1,z,color,true);
  }
  if(ret.getVoxel(x,y+1,z)!=color){
    ret.flood(x,y+1,z,color,true);
  }

  return ret;
}

BinaryVoxelCube.prototype.coordsToIndex = function(x,y,z){
  console.log('z: '+z+'x'+this.sizeY+'x'+this.sizeX+'='+(z*this.sizeY*this.sizeX));
  console.log('y: '+y+'x'+this.sizeX+'='+(y*this.sizeX));
  console.log('x: '+x);
  console.log('=:'+(z*this.sizeY*this.sizeX+y*this.sizeX+x));
  return z*this.sizeY*this.sizeX+y*this.sizeX+x;
}

BinaryVoxelCube.prototype.flood = function(x,y,z,color){
  const sizeXY=this.sizeX*this.sizeY;
  const sizeXYZ=this.sizeX*this.sizeY*this.sizeZ;

  let pending = new bitArray(sizeXYZ);
  let ret = this.voxelData.copy();

  const self=this;

  let lastIndex=0;
  function getFirstPending(secondRun){
    for(var i=lastIndex;i<sizeXYZ;i++){
      if(pending.get(i)){
        lastIndex=i;
        return i;
      }
    }
    if(!secondRun){
      lastIndex=0;
      console.log('second run');
      return getFirstPending(true);
    }
  }

  function indexToCoords(idx){
    let z=Math.floor(idx/sizeXY);
    let rem=idx%sizeXY;
    let y=Math.floor(rem/self.sizeX);
    let x=rem%self.sizeX;
    return {x,y,z};
  }

  function coordsToIndex(x,y,z){
    return z*sizeXY+y*self.sizeX+x;
  }

  function floodPixel(idx){
    const coords=indexToCoords(idx);
    pending.set(idx,false);
    ret.set(idx,color);

    if(coords.x>0 && ret.get(idx-1)!=color){
      try {
        pending.set(idx-1,true);
      } catch (e) {
        console.log('x-1 error at',coords);
        throw(e);
      }
    }

    if(coords.x<self.sizeX-1 && ret.get(idx+1)!=color){
      try {
        pending.set(idx+1,true);
      } catch (e) {
        console.log('x+1 error at',coords);
        throw(e);
      }
    }

    if(coords.y>0 && ret.get(idx-self.sizeX)!=color){
      try {
        pending.set(idx-self.sizeX,true);
      } catch (e) {
        console.log('y-1 error at',coords);
        throw(e);
      }
    }

    if(coords.y<self.sizeY-1 && ret.get(idx+self.sizeX)!=color){
      try {
        pending.set(idx+self.sizeX,true);
      } catch (e) {
        console.log('y+1 error at',coords);
        throw(e);
      }
    }

    if(coords.z>0 && ret.get(idx-sizeXY)!=color){
      try {
        pending.set(idx-sizeXY,true);
      } catch (e) {
        console.log('z-1 error at',coords);
        throw(e);
      }
    }

    if(coords.z<self.sizeZ-1 && ret.get(idx+sizeXY)!=color){
      try {
        pending.set(idx+sizeXY,true);
      } catch (e) {
        console.log('z+1 error at',coords);
        throw(e);
      }
    }
  }

  pending.set(coordsToIndex(x,y,z),true);

  let counter=0;
  let label='Flooding cycle no.'+counter;
  console.time(label);
  while(pending.count()){
    if(!(counter%5)){
      console.timeEnd(label);
      console.log(pending.count());
      label='Flooding cycle no.'+(counter+100);
      console.time(label);
    }
    floodPixel(getFirstPending());
    counter++;
  }
  console.timeEnd(label);

  return new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,ret);
}

module.exports = BinaryVoxelCube;
