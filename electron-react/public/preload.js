// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge } = require("electron");
const { webFrame } = require('electron')

  webFrame.setZoomFactor(1.2);
  // disable zooming +/-
  window.onkeydown = function(evt) {
    console.log(evt)
    if ((evt.code === "BracketRight" && webFrame.getZoomFactor() > 1.4) || (evt.code === "Slash" && webFrame.getZoomFactor() < 0.8)){
      evt.preventDefault()
    }
}

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".
process.once("loaded", () => {
  contextBridge.exposeInMainWorld("versions", process.versions);
});
