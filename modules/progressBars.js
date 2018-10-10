const event=require('./event.js');

commonChannel=new event();
let progressBars={};
commonChannel.on("progress",(data)=>{
  //console.log(data);
  if(data.state=='start'){
    progressBars[data.functionId]={
      method:data.method,
      message:data.message,
      percent:data.percent,
      state:data.state,
      functionId:data.functionId,
      timeStart:Date.now(),
      timePassed:0
    }
  } else if(data.state=='pending'){
    if(!progressBars[data.functionId]){
      throw new Error(JSON.stringify(data,null,'/t'));
    }
    progressBars[data.functionId].message=data.message;
    progressBars[data.functionId].percent=data.percent;
    progressBars[data.functionId].state=data.state;
    progressBars[data.functionId].timePassed=Date.now()-progressBars[data.functionId].timeStart;
  } else if(data.state=='end'){
    if(!progressBars[data.functionId]){
      throw new Error(JSON.stringify(data,null,'/t'));
    }
    progressBars[data.functionId].message=data.message;
    progressBars[data.functionId].percent=data.percent;
    progressBars[data.functionId].state=data.state;
    progressBars[data.functionId].timePassed=Date.now()-progressBars[data.functionId].timeStart;
  } else if(data.state=='error'){
    if(!progressBars[data.functionId]){
      throw new Error(data);
    }
  }


  console.clear();
  for(let idx in progressBars){
    let bar='';
    let seconds=Math.round(progressBars[idx].timePassed)/1000;
    let minutes=Math.floor(seconds/60);
    let hours=Math.floor(seconds/3600);

    if(hours<10) hours="0"+hours;
    if(minutes<10){
      minutes="0"+(minutes%60);
    } else {
      minutes=minutes%60;
    }

    if(seconds<10){
      seconds="0"+(seconds%60);
    } else {
      seconds=seconds%60;
    }

    let time=hours+":"+minutes+":"+((''+seconds).substring(0,5));
    if(progressBars[idx].state=='start'){
      bar=" INITIAL: ";
    } else if (progressBars[idx].state=='pending'){
      bar=" PENDING: ";
    } else if (progressBars[idx].state=='end'){
      bar="COMPLETE: ";
    } else {
      bar="????????: ";
    };
    let counter=0;
    //▓▒░
    for(let i=0;i<(Math.floor((progressBars[idx].percent-1)/10));i++){
      counter++
      bar=bar+'▒';
    }
    bar=bar+(progressBars[idx].percent<100?'▓':'▒');
    for(let i=0;i<(9-counter);i++){
      bar=bar+'░';
    }

    bar=bar+((progressBars[idx].percent<10)?' ':'')+((progressBars[idx].percent<100)?' ':'')+progressBars[idx].percent+'%: '+'('+time+') ['+progressBars[idx].method.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, "$1").toUpperCase()+'] '+progressBars[idx].message;
    console.log(bar);
  }

  console.log('\nLAST EVENT:',data);
});

module.exports=commonChannel;
