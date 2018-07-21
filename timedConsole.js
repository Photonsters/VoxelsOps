let startTime = Date.now();
function timedLog(...args){
  let miliseconds=Date.now()-startTime;
  seconds=miliseconds/1000;
  minutes=Math.floor(seconds/60);
  hours=Math.floor(seconds/3600);

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

  let ret=hours+":"+minutes+":"+seconds;

  console.log(ret+": ", ...args);
}

module.exports = timedLog;
