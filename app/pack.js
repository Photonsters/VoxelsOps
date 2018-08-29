const packager = require('electron-packager')
packager({
  dir:'.',
  extraResource:['background.js','modules'],
  executableName:'xxx',
  platform:['linux','win32'],
  arch:'x64',
  overwrite:true
}).then((appPaths)=>{
  console.log("done", appPaths);
}).catch(err => {
  console.log(err);
})
