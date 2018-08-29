// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var {ipcRenderer, remote} = require('electron');
var main = remote.require("./main.js");

// Send async message to main process
//ipcRenderer.send('async', 1);

ipcRenderer.on('async-reply', (event, arg) => {
    // Print 2
    console.log(arg);
    // Send sync message to main process
    ipcRenderer.send('async', 3);
});
