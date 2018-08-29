function resetState(){
  document.getElementById("cancel").classList.add('hidden');
  document.getElementById("generate").classList.remove('hidden');
  document.querySelector('#loaders').innerHTML="";
}

document.getElementById("generate").addEventListener("click",()=>{
  document.querySelector('#loaders').innerHTML="";
  ipcRenderer.send('startVoxelEngine', {
    method:'gyroidInfill',
    path:document.getElementById("photonFile").files[0].path,
    radius:document.getElementById("radius").value,
    block:document.getElementById("block").value,
    smooth:document.getElementById("smooth").checked,
    pattern:document.getElementById("pattern").value,
    tolerance:document.getElementById("tolerance").value
  });
  document.getElementById("cancel").classList.remove('hidden');
  document.getElementById("generate").classList.add('hidden');
});

document.getElementById("cancel").addEventListener("click",()=>{
  //ipcRenderer.send('photonFile', document.getElementById("photonFile").files[0].path);
  ipcRenderer.send('stopVoxelEngine', {});
  resetState();
});

const events=['change','input'];
for(var i=0;i<events.length;i++){
  document.getElementById("radius").addEventListener(events[i],()=>{
    document.querySelector(".rangeDisplay[for="+"radius"+"]").value=document.getElementById("radius").value*Math.pow(2,document.getElementById("block").value)+"px / ~"+Math.round(document.getElementById("radius").value*Math.pow(2,document.getElementById("block").value)*0.05*100000)/100000+"mm";
  });

  document.getElementById("block").addEventListener(events[i],()=>{
    document.querySelector(".rangeDisplay[for="+"block"+"]").value="x"+Math.pow(2,document.getElementById("block").value);
    document.querySelector(".rangeDisplay[for="+"radius"+"]").value=document.getElementById("radius").value*Math.pow(2,document.getElementById("block").value)+"px / ~"+Math.round(document.getElementById("radius").value*Math.pow(2,document.getElementById("block").value)*0.05*100000)/100000+"mm";
  });

  document.getElementById("pattern").addEventListener(events[i],()=>{
    document.querySelector(".rangeDisplay[for="+"pattern"+"]").value=document.getElementById("pattern").value+"px";
  });

  document.getElementById("tolerance").addEventListener(events[i],()=>{
    document.querySelector(".rangeDisplay[for="+"tolerance"+"]").value=document.getElementById("tolerance").value;
  });
}

ipcRenderer.on('actionFinished', (event, ...args) => {
  document.getElementById("cancel").classList.add('hidden');
  document.getElementById("generate").classList.remove('hidden');
});
