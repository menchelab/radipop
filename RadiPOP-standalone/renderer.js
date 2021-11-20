"use strict";

const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require('http');
const url = require('url')

// Keep a global reference of the mainWindowdow object, if you don't, the mainWindowdow will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let subpy = null;

const PY_DIST_FOLDER = "dist-python"; // python distributable folder
const PY_SRC_FOLDER = "web_app"; // path to the python source
const PY_MODULE = "run_app.py"; // the name of the main module

const isRunningInBundle = () => {
  return require("fs").existsSync(path.join(__dirname, PY_DIST_FOLDER));
};

const getPythonScriptPath = () => {
  console.log(__dirname);
  if (!isRunningInBundle()) {
    console.log(path.join(__dirname, PY_SRC_FOLDER, PY_MODULE))
    return path.join(__dirname, PY_SRC_FOLDER, PY_MODULE);
  }
  if (process.platform === "win32") {
    return path.join(
      __dirname,
      PY_DIST_FOLDER,
      PY_MODULE.slice(0, -3) + ".exe"
    );
  }
  return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE.slice(0, -3));
};

const startPythonSubprocess = () => {
  let script = getPythonScriptPath();
  if (isRunningInBundle()) {
    subpy = require("child_process").execFile(script, []);
    console.log("Python executable");
    console.log(script)
  } else {
    subpy = require("child_process").spawn("python", [script]);
    console.log("Python script");
    console.log(script)
  }
  subpy.stdout.on('data', (data) => {
    let dataStr = `${data}`
    console.log("Flask", dataStr)
  });
  subpy.stderr.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });
};

const killPythonSubprocesses = (main_pid) => {
  const python_script_name = path.basename(getPythonScriptPath());
  let cleanup_completed = false;
  const psTree = require("ps-tree");
  psTree(main_pid, function (err, children) {
    let python_pids = children
      .filter(function (el) {
        return el.COMMAND == python_script_name;
      })
      .map(function (p) {
        return p.PID;
      });
    
    //Fix for MacOS --> flask server won't shutdown 
    if (process.platform == "darwin") {
      console.log("killPythonSubprocesses")
      console.log(subpy.pid)
      process.kill(subpy.pid);
    }
    // kill all the spawned python processes
    python_pids.forEach(function (pid) {
      process.kill(pid);
      console.log(pid)
    });
    subpy = null;
    cleanup_completed = true;
  });
  return new Promise(function (resolve, reject) {
    (function waitForSubProcessCleanup() {
      if (cleanup_completed) return resolve();
      setTimeout(waitForSubProcessCleanup, 30);
    })();
  });
};

const createMainWindow = () => {
  // Create the browser mainWindow
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 800,
    // transparent: true, // transparent header bar
    icon: __dirname + "/icon.png",
    // fullscreen: true,
    // opacity:0.8,
    // darkTheme: true,
    // frame: false,
    resizeable: true,
  });



  // Now wait for the backend server start up. Continuously poll the HTTP endpoint until we receive a page.
  // TODO: At some point, we should time out and display an error message
  // TODO: If the child process dies, we should give up and display an error message
  const pingServerAndNavigateIfSuccessful = (url) => {
    const REQUEST_TIMEOUT_MS = 100;
    const RETRY_INTERVAL_MS = 500;
    http.get(url, {timeout: REQUEST_TIMEOUT_MS}, (res) => {
      // Load the index page
      mainWindow.loadURL(url);
    }).on('error', (e) => { //IF http request fails retry after RETRY_INTERVAL_MS unitl the python server is up 
      console.error(`Got error: ${e.message}`);
      // Retry shortly
      setTimeout(() => pingServerAndNavigateIfSuccessful(url), RETRY_INTERVAL_MS);
    });
  };

  const url = "http://localhost:4040/";
  // pingServerAndNavigateIfSuccessful(url);
 
  mainWindow.loadFile(path.join(__dirname, "web_app/frame/index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Emitted when the mainWindow is closed.
  mainWindow.on("closed", function () {
    // Dereference the mainWindow object
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function () {
  // start the backend server
  startPythonSubprocess();
  createMainWindow();
});

// disable menu
app.on("browser-window-created", function (e, window) {
  window.setMenu(null);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== "darwin") {
  let main_process_pid = process.pid;
  killPythonSubprocesses(main_process_pid).then(() => {
    app.quit();
  });
  //}
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (subpy == null) {
    startPythonSubprocess();
  }
  if (win === null) {
    createMainWindow();
  }
});

app.on("quit", function () {
  // do some additional cleanup
});
