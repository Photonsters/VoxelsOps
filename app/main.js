// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const {spawn} = require('child_process');
let voxelEngine;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  //mainWindow.openDevTools();

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;

    try {
      voxelEngine.kill('SIGINT');
    } catch(err) {
      //cosnole.log(err);
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function log(...args){
  mainWindow.webContents.send('fromMain',...args);
}

function receiveFromVoxelEngine(data){
  if(data.message=="logMain"){
    console.log("from voxelEngine:"+data.text);
  }
  mainWindow.webContents.send('fromVoxelEngine',data);
}

function errorFromVoxelEngine(data){
  mainWindow.webContents.send('errorFromVoxelEngine:'+data.message,data.data);
}

// Listen for async message from renderer process
let engineRunning=false;
ipcMain.on('startVoxelEngine', (event, data) => {
  log('loading voxel engine: '+JSON.stringify(data));
  // try{
    if(engineRunning){
      return;
    }
    engineRunning=true;
    voxelEngine=spawn('node', ['./background.js',(JSON.stringify(data))], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    }).on('message', function(data) {
      console.log(data);
      if(data.message=="logMain"){
        console.log(data.text);
      } else {
        receiveFromVoxelEngine(data);
      }
    }).on('error',err=>{
      errorFromVoxelEngine({
        message:'error',
        data:err
      });
      engineRunning=false;
      mainWindow.webContents.send('actionFinished');
    }).on('exit',data=>{
      errorFromVoxelEngine({
        message:'exit',
        data:data
      });
      engineRunning=false;
      mainWindow.webContents.send('actionFinished');
    }).on('disconnect',data=>{
      errorFromVoxelEngine({
        message:'disconnect',
        data:data
      });
      engineRunning=false;
      mainWindow.webContents.send('actionFinished');
    }).on('close',data=>{
      errorFromVoxelEngine({
        message:'close',
        data:data
      });
      engineRunning=false;
      mainWindow.webContents.send('actionFinished');
    });
  // } catch(err) {
  //   errorFromVoxelEngine({
  //     message:"error",
  //     data:err
  //   });
  // }
});

ipcMain.on('stopVoxelEngine', (event) => {
  voxelEngine.kill('SIGINT');
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
