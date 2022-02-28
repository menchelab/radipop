import React, { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import "./styles/index.css";
import ToolBar from "./components/toolbar/Toolbar.js";
import Editing from "./components/editing/Editing.js";
import Display from "./components/display/Display.js";
import slice_place_holder from "./assets/images/editor_placeholder.png";

/**
 * @namespace App
 */

function App() {
  // Container object to hold states/variables
  let RP = {};
  //
  const [selectedPoints, setselectedPoints] = useState([]);
  RP.selectedPoints = selectedPoints;
  RP.setselectedPoints = setselectedPoints;
  // CONST values
  RP.LIVER_LABEL = 1;
  RP.SPLEEN_LABEL = 2;
  RP.FLASK_SERVER = "http://localhost:4041";
  // Clipping values for dcm2png conversion
  RP.low_clip = 850;
  RP.high_clip = 1250;
  // Boolean state to decide between drawing and highlighting on Canvas
  const [highlightMode, sethighlightMode] = useState(true);
  RP.highlightMode = highlightMode;
  RP.sethighlightMode = sethighlightMode;
  // RadiPOP state: list of all files (.p and .png), list of list for slices
  // and masks, and directory "patient"
  const [RadiPOPstates, setRadiPOPstates] = useState({
    files: [],
    slice_mask_container: [[slice_place_holder, ""]],
    currentSliceIndex: 0,
    patient: "None",
  });
  RP.RadiPOPstates = RadiPOPstates;
  RP.setRadiPOPstates = setRadiPOPstates;
  // Boolean state to show/hide slice
  const [showSlice, setshowSlice] = useState(true);
  RP.showSlice = showSlice;
  RP.setshowSlice = setshowSlice;
  // Boolean state to show/hide mask
  const [showMask, setshowMask] = useState(false);
  RP.showMask = showMask;
  RP.setshowMask = setshowMask;
  // State to update mask after computation with useEffect hook
  const [newMask, setNewMask] = useState("");
  RP.newMask = newMask;
  RP.setNewMask = (p) => {
    setNewMask(p);
  };
  // Boolean state to check if Flask server is initialized
  const [flaskIntialized, setflaskIntialized] = useState(false);
  RP.flaskIntialized = flaskIntialized;
  RP.setflaskIntialized = (p) => {
    setflaskIntialized(p);
  };
  // List state to show log information messages
  const [logInfo, setlogInfo] = useState([
    "Log: Here you will find important information about the App status and possible errors",
  ]);
  RP.logInfo = logInfo;
  RP.setlogInfo = setlogInfo;
  // Boolean state to disable app during computations, e.g. global thresholds
  const [disableApp, setDisableApp] = useState(false);
  RP.disableApp = disableApp;
  RP.setDisableApp = setDisableApp;
  // Object state for liver button depending on mask label
  const [LiverButton, setLiverButton] = useState({
    label: "Set liver label",
    remove: false,
  });
  RP.LiverButton = LiverButton;
  RP.setLiverButton = setLiverButton;
  // Object state for spleen button depening on mask label
  const [SpleenButton, setSpleenButton] = useState({
    label: "Set spleen label",
    remove: false,
  });
  RP.SpleenButton = SpleenButton;
  RP.setSpleenButton = setSpleenButton;
  // State for slice if no mask is available
  const [FirstMaskForSlice, setFirstMaskForSlice] = useState(0);
  RP.FirstMaskForSlice = FirstMaskForSlice;
  RP.setFirstMaskForSlice = setFirstMaskForSlice;
  // React ref to store array of refs -> used for scrolling sidebar
  const scrollRefs = useRef([]);
  RP.scrollRefs = scrollRefs;
  // Hook to re-render new mask after computation
  useEffect(() => {
    let update = RP.RadiPOPstates.slice_mask_container;
    update[RP.RadiPOPstates.currentSliceIndex][1] = newMask;
    setRadiPOPstates({
      files: RP.RadiPOPstates.files,
      slice_mask_container: update,
      currentSliceIndex: RP.RadiPOPstates.currentSliceIndex,
      patient: RP.RadiPOPstates.patient,
      showMask: RP.RadiPOPstates.files.length > 0,
      status: RP.RadiPOPstates.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMask]);

  return (
    // Passing state to Toolbar and Display
    <div>
      <ToolBar key="Toolbar" RP={RP} />
      <div className="row">
        <Editing key="Editing" RP={RP} />
        {RP.RadiPOPstates && <Display RP={RP} />}
      </div>
    </div>
  );
}
export default App;
