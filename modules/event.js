function eventChannel(){
  this.listeners=[];
  this.idGen=0;
}

eventChannel.prototype.on = function(message,foo){
  const id=this.idGen++;
  this.listeners.push({
    id,
    message,
    foo
  });
  return id;
}

eventChannel.prototype.off = function(id){
  this.listeners=this.listeners.filter((item)=>{
    return item.id!=id;
  });
}

eventChannel.prototype.emit = function(message, ...payload){
  //console.log(this.listeners.length,"->",JSON.stringify(payload));
  for(let i=0;i<this.listeners.length;i++){
    if(!message || this.listeners[i].message===message){
      this.listeners[i].foo(...payload);
    }
  }
}

module.exports=eventChannel;
