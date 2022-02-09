// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const url = require("url");
let subpy = null;

const PY_DIST_FOLDER = "../../app/dist-python"; // python distributable folder
const PY_SRC_FOLDER = "../segmenter_flask_API"; // path to the python source
const PY_MODULE = "segmenter_flask_API.py"; // the name of the main module
//Check if packaged python segmenter exists
const pythonBuildExists = () => {
  return require("fs").existsSync(path.join(__dirname, PY_DIST_FOLDER));
};

//Get path to python script or python executable if available
const getPythonScriptPath = () => {
  console.log(__dirname);
  if (!pythonBuildExists() || !app.isPackaged) {
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
  if (pythonBuildExists() && app.isPackaged) {
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

// Create the native browser window.
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth:600,
    minHeight:600,
    icon: __dirname + '/favicon.ico',
    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = app.isPackaged
    ? url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
      })
    : "http://localhost:3000";
  mainWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Setup a local proxy to adjust the paths of requested files when loading
// them from the local production bundle (e.g.: local fonts, etc...).
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(8);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (error) => {
      if (error) console.error("Failed to register protocol");
    }
  );
}

// This method will be called when Electron has finished its initialization and
// is ready to create the browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  startPythonSubprocess();
  createWindow();
  setupLocalFilesNormalizerProxy();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", function () {
  let main_process_pid = process.pid;
  killPythonSubprocesses(main_process_pid).then(() => {
    app.quit();
  });
});

// If your app has no need to navigate or only needs to navigate to known pages,
// it is a good idea to limit navigation outright to that known scope,
// disallowing any other kinds of navigation.
const allowedNavigationDestinations = "https://my-electron-app.com";
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
