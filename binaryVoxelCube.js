const bitArray = require('bit-array');

function BinaryVoxelCube(sizeX,sizeY,sizeZ,pixels){
  if(sizeX*sizeY*sizeZ !== pixels.length){
    console.log("expected size:",sizeX*sizeY*sizeZ);
    console.log("real size:",pixels.length);
    throw new Error('pixel do not match size');
  }
  this.sizeX=sizeX;
  this.sizeY=sizeY;
  this.sizeZ=sizeZ;
  this.voxelData=new bitArray(sizeX*sizeY*sizeZ);
  //copy voxel data into new variable to prevent overriding;
  this.voxelData=pixels.copy();
  this.refreshBoundingBox();
  this.type='BinaryVoxelCube';
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
  return this.voxelData.set(this.sizeX*this.sizeY*z+this.sizeX*y+x,color);
}

BinaryVoxelCube.prototype.getLayer = function(z){
  sizeXY=this.sizeX*this.sizeY;
  let ret=new bitArray(sizeXY);
  for(let i=0;i<sizeXY;i++){
    ret.set(i,this.voxelData.get((z-1)*sizeXY+i));
  }
  return ret;
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

BinaryVoxelCube.prototype.volume = function(){
  return this.voxelData.count();
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

BinaryVoxelCube.prototype.refreshBoundingBox = function(){
  this.boundingBox={
    left:this.sizeX-1,
    right:0,
    front:this.sizeY-1,
    back:0,
    bottom:this.sizeZ-1,
    top:0
  }
  for(let z=0;z<this.sizeZ;z++){
    for(let y=0;y<this.sizeY;y++){
      for(let x=0;x<this.sizeX;x++){
        var value=this.getVoxel(x,y,z);
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

BinaryVoxelCube.prototype.booleanAdd = function(bvc){ //another binary voxel cube
  if(bvc.type=='BinaryVoxelPattern'){
    throw new Error('do not use boolean add with infinite patterns! cut part of them with intersect first!');
  }
  if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
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
  for(let z=boundingBox.bottom;z<boundingBox.top;z++){
    for(let y=boundingBox.front;y<boundingBox.back;y++){
      for(let x=boundingBox.left;x<boundingBox.right;x++){
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

  return new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData);
}

BinaryVoxelCube.prototype.booleanIntersect = function(bvc){ //another binary voxel cube
  if(bvc.type=='BinaryVoxelPattern'){
    let combinedData=new bitArray(this.sizeX*this.sizeY*this.sizeZ);

    for(let z=this.boundingBox.bottom;z<this.boundingBox.top;z++){
      for(let y=this.boundingBox.front;y<this.boundingBox.back;y++){
        for(let x=this.boundingBox.left;x<this.boundingBox.right;x++){
          let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
          combinedData.set(idx,(this.getVoxel(x,y,z)&&bvc.getVoxel(x,y,z)))
        }
      }
    }
    return new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,combinedData);
  } else {
    if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
      throw new Error('cubes have different profile!');
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
    for(let z=boundingBox.bottom;z<boundingBox.top;z++){
      for(let y=boundingBox.front;y<boundingBox.back;y++){
        for(let x=boundingBox.left;x<boundingBox.right;x++){
          let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
          if(z<minZ){
            combinedData.set(idx,(this.voxelData.get(idx)&&bvc.voxelData.get(idx)))
          } else {
            combinedData.set(idx,false);
          }
        }
      }
    }

    return new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData);
  }
}

BinaryVoxelCube.prototype.booleanDifference = function(bvc){ //another binary voxel cube
  if(bvc.type=='BinaryVoxelPattern'){ //this hack allows to use patterns, it is even much simpler than standard case
    let combinedData=new bitArray(this.sizeX*this.sizeY*this.sizeZ);
    for(let z=this.boundingBox.bottom;z<this.boundingBox.top;z++){
      for(let y=this.boundingBox.front;y<this.boundingBox.back;y++){
        for(let x=this.boundingBox.left;x<this.boundingBox.right;x++){
          let idx=z*this.sizeX*this.sizeY+y*this.sizeX+x;
          combinedData.set(idx,this.getVoxel(x,y,z)&&!bvc.getVoxel(x,y,z));
        }
      }
    }

    return new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,combinedData);
  } else {
    if(bvc.sizeX!==this.sizeX || bvc.sizeY!==this.sizeY){
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
    for(let z=boundingBox.bottom;z<boundingBox.top;z++){
      for(let y=boundingBox.front;y<boundingBox.back;y++){
        for(let x=boundingBox.left;x<boundingBox.right;x++){
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

    return new BinaryVoxelCube(this.sizeX,this.sizeY,(originalIsTaller?this:bvc).sizeZ,combinedData);
  }
}

BinaryVoxelCube.prototype.booleanInversion = function(){
  return new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,this.voxelData.not());
}

BinaryVoxelCube.prototype.translate = function(dx,dy,dz){
  let ret=new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,new bitArray(this.sizeX*this.sizeY*this.sizeZ))
  let sizeXY=this.sizeX*this.sizeY;
  for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z++){
    for(let y=this.boundingBox.front;y<=this.boundingBox.back;y++){
      for(let x=this.boundingBox.left;x<=this.boundingBox.right;x++){
        ret.setVoxel(x+dx,y+dy,z+dz,this.getVoxel(x,y,z));
      }
    }
  }
  ret.refreshBoundingBox();
  return ret;
}

BinaryVoxelCube.prototype.erode = function(r=1,scale=0, smooth=false){
  let work=new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ, this.voxelData.copy());
  for(let i=0;i<scale;i++){
    console.log('scaling down');
    work=work.scaleDown(smooth);
  }
  let ret=new BinaryVoxelCube(work.sizeX,work.sizeY,work.sizeZ, new bitArray(work.sizeX*work.sizeY*work.sizeZ));

  function isInside(x,y,z){
    if(!work.getVoxel(x,y,z)){
      return false;
    }
    if(!work.getVoxel(x-1,y,z)){
      return false;
    } else if(!work.getVoxel(x+1,y,z)){
      return false;
    } else if(!work.getVoxel(x,y-1,z)){
      return false;
    } else if(!work.getVoxel(x,y+1,z)){
      return false;
    } else if(!work.getVoxel(x,y,z-1)){
      return false;
    } else if(!work.getVoxel(x,y,z+1)){
      return false;
    }
    return true;
  }
  for(let i=0;i<r;i++){
    console.log("erode cycle no. ",(i+1));
    for(let z=work.boundingBox.bottom;z<=work.boundingBox.top;z++){
      for(let y=work.boundingBox.front;y<=work.boundingBox.back;y++){
        for(let x=work.boundingBox.left;x<=work.boundingBox.right;x++){
          ret.setVoxel(x,y,z,isInside(x,y,z));
        }
      }
    }
    work.voxelData=ret.voxelData;
    work.refreshBoundingBox();
    ret.voxelData=new bitArray(work.sizeX*work.sizeY*work.sizeZ);
  }

  for(let i=0;i<scale;i++){
    console.log('scaling up')
    work=work.scaleUp(smooth);
  }

  return work;
}

BinaryVoxelCube.prototype.scaleDown = function(smooth=false){
  let ret=new BinaryVoxelCube(this.sizeX >> 1,this.sizeY >> 1,this.sizeZ >> 1,new bitArray((this.sizeX >> 1)*(this.sizeY >> 1)*(this.sizeZ >> 1)));
  ret.originalResolution=this.originalResolution||[];
  ret.originalResolution.push({
    x:this.sizeX,
    y:this.sizeY,
    z:this.sizeZ
  });
  for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z+=2){
    for(let y=this.boundingBox.front;y<=this.boundingBox.back;y+=2){
      for(let x=this.boundingBox.left;x<=this.boundingBox.right;x+=2){
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
            +this.getVoxel(x+1,y+1,z+1))/8)
        } else {
          val=this.getVoxel(x,y,z)
        }
        ret.setVoxel(x >> 1, y >> 1, z >> 1, val);
      }
    }
  }
  ret.refreshBoundingBox();
  return ret;
}

BinaryVoxelCube.prototype.scaleUp = function(smooth=false,additive=true){
  let ret;
  if(this.originalResolution && this.originalResolution.length){
    let res=this.originalResolution.pop();
    ret=new BinaryVoxelCube(res.x,res.y,res.z,new bitArray(res.x*res.y*res.z));
  } else {
    ret=new BinaryVoxelCube(this.sizeX << 1,this.sizeY << 1,this.sizeZ << 1,new bitArray((this.sizeX*this.sizeY*this.sizeZ)<<3));
  }

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

  for(let z=this.boundingBox.bottom;z<=this.boundingBox.top;z++){
    for(let y=this.boundingBox.front;y<=this.boundingBox.back;y++){
      for(let x=this.boundingBox.left;x<=this.boundingBox.right;x++){
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
  ret.refreshBoundingBox();
  return ret;
}

BinaryVoxelCube.prototype.dilate = function(r){
  const self=this;
  let old=this.voxelData.copy();

  function getVoxel(x,y,z){
    return old.get(z*self.sizeX*self.sizeY+y*self.sizeX+x);
  }

  function setVoxel(x,y,z,val){
    ret.set(z*self.sizeX*self.sizeY+y*self.sizeX+x,val);
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
    for(let z=Math.max(this.boundingBox.bottom-i,0);z<=Math.min(this.boundingBox.top+1,this.sizeZ-1);z++){
      for(let y=Math.max(this.boundingBox.front-i,0);y<=Math.min(this.boundingBox.back+1,this.sizeY-1);y++){
        for(let x=Math.max(this.boundingBox.left-i,0);x<=Math.min(this.boundingBox.right+1,this.sizeX-1);x++){
          dilateVoxel(x,y,z);
        }
      }
    }
    old=ret.copy();
  }

  return new BinaryVoxelCube(this.sizeX,this.sizeY,this.sizeZ,ret);
}

module.exports = BinaryVoxelCube;
