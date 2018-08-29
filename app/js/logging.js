function log(data){
  let loader=document.querySelector('#loaders #'+data.method);
  let progress;
  let message;
  if(!loader){
    loader=document.createElement('fieldset');
    loader.id=data.method;
    let caption=document.createElement('legend');
    caption.innerHTML=data.method || "Processing...";
    loader.appendChild(caption);
    progress=document.createElement('progress');
    progress.max=100;
    progress.class
    loader.appendChild(progress);
    message=document.createElement('input');
    message.type='text';
    message.readonly='readonly';
    loader.appendChild(message);
    document.getElementById('loaders').appendChild(loader);
  } else {
    progress=loader.querySelector('progress');
    message=loader.querySelector('input')
  }
  if(!data.method){
    console.log("unknown method:",data);
    throw new Error("no method found");
  }
  message.value=(data.method?(data.message+" ("+data.percent+"%)"):("processing... ("+(data.percent||100)+"%)"));
  progress.value=data.percent||100;
  progress.className=data.state;
  //document.getElementById("console").innerHTML=data.message;
  //document.getElementById("progressBar").value=data.percent;
  //document.getElementById("model").value=data.model+(data.method?(": "+data.method+"("+data.percent+"%)"):(": Loading file... ("+data.percent+"%)"));
  console.log(data);
}

ipcRenderer.on('fromVoxelEngine', (event, arg) => {
  console.log('messageFromVoxelEngine',arg);
  log(arg);
});

ipcRenderer.on('fromMain', (event, ...args) => {
  console.log('messageFromMain',...args);
});
