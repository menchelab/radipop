import React, { useState, useEffect } from "react";
import SearchBar from "../toolbar/Searchbar.js";
import Button from "../toolbar/Button.js";
import Input from "../toolbar/Input.js";
import LogMessage from "../log/LogMessage.js";
import "../../styles/toolbar.css";
import "../../styles/index.css";
import Dcm2PngWindow from "../toolbar/Dcm2PngWindow";

/**
 * @namespace toolbar
 */

/**
 * Creates Toolbar component
 * @memberof App
 * @method ToolBar
 * @param {*} props RP variable from App.js
 * @returns Toolbar div
 * @example
 * <ToolBar key="Toolbar" RP={RP} />
 */

function ToolBar(props) {
  /**
   * @namespace ToolBar
   */

  /**
   * Initialize Flask server with patient slices and mask files (if available)
   * @memberof ToolBar
   * @method initialize
   * @param {*} paths Paths to slice files
   * @param {*} smc Slice mask container
   * @param {*} mask_files Container with mask files
   * @param {*} patientID ID of patient
   */
  const initialize = (paths, smc, mask_files, patientID) => {
    let data = {
      paths: paths,
      patientID: patientID,
    };
    fetch(props.RP.FLASK_SERVER + "/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data["message"]);
        let mask_files_paths = mask_files.map((item) => item.path);
        for (let i = 0; i < mask_files_paths.length; i++) {
          postPickleGetMask(smc, i, mask_files_paths[i], patientID);
        }
        props.RP.setflaskIntialized(true);
      })
      .catch(error_handler);
  };

  /**
   * Function is raised when requests to Flask server fail for any reason:
   * Creates LogMessage \n
   * Enables App again (unfreezing)
   * @memberof ToolBar
   * @method error_handler
   */
  function error_handler() {
    const logInfo = props.RP.logInfo.concat(
      <LogMessage
        type="error"
        message="Failed to contact flask server or Flask handling error"
      />
    );
    props.RP.setlogInfo(logInfo);
    props.RP.setDisableApp(false);

    //alert("Failed to contact flask server or Flask handling error
    //It may take a while to start up the server... Try again later.");
  }

  /**
   * Post the path to a mask pickle file
   * and get a transparent PNG file in return
   * Updates global variable numberOfConvertedMasksHelper
   * @memberof ToolBar
   * @method postPickleGetMask
   * @param {*} smc Slice mask container
   * @param {*} index Index of mask
   * @param {*} path Path to the mask file
   * @param {*} patientID ID of the patient
   */
  const postPickleGetMask = (smc, index, path, patientID) => {
    let data = {
      index: index,
      path: path,
      patientID: patientID,
    };
    fetch(props.RP.FLASK_SERVER + "/postPickleGetMask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let bytestring = data["mask"];
        let img = bytestring.split("'")[1];
        img = "data:image/png;base64," + img;
        smc[index][1] = img;
        numberOfConvertedMasksHelper = numberOfConvertedMasksHelper + 1;
        setnumberOfConvertedMasks(numberOfConvertedMasksHelper);
      })
      .catch(error_handler);
  };

  /**
   * Handler for Input Open Button -> load files
   * @memberof Toolbar
   * @method openHandler
   * @param {*} event Event
   */
  const openHandler = (event) => {
    console.log("open handler");
    let target_files = [];
    // Filter out only .png or .p files that start with a number (0-99999...)
    for (let i = 0; i < event.target.files.length; i++) {
      if (event.target.files[i].name.match(/^(0|[1-9][0-9]*)\.(png|p)$/g)) {
        target_files.push(event.target.files[i]);
      }
    }

    // Check if user selected new files -> return if user clicked "cancel"
    if (target_files.length > 0) {
      initializeWithFiles(target_files);
    } else {
      const logInfo = props.RP.logInfo.concat(
        <LogMessage type="error" message="No slice files (.png) were found." />
      );
      props.RP.setlogInfo(logInfo);
    }
    //In order to be able to call dcm2png again on same dir -> event must change
    event.target.value = "";
  };

  /**
   * Initializes Flask server with files
   * @memberof ToolBar
   * @param {*} files Files
   *
   */
  const initializeWithFiles = (files) => {
    let mask_files = []; // array to store .p files
    let slice_files = []; // array to store .png slices
    // Set State: all loaded files unordered
    // Split .p and .png files
    for (let i = 0; i < files.length; i++) {
      if (files[i].name.endsWith(".png")) {
        slice_files.push(files[i]);
      }
      if (files[i].name.endsWith(".p")) {
        mask_files.push(files[i]);
      }
    }

    if (slice_files.length === 0) {
      const logInfo = props.RP.logInfo.concat(
        <LogMessage type="error" message="No slice files (.png) were found." />
      );
      props.RP.setlogInfo(logInfo);
      return;
    }

    // Get selected directory/patient name
    let directory_name = files[0].webkitRelativePath;
    directory_name = directory_name.substr(0, directory_name.indexOf("/"));

    props.RP.setRadiPOPstates({
      files: files,
    });

    // Order slices and masks
    slice_files = [].slice
      .call(slice_files)
      .sort((a, b) =>
        parseInt(a.name.replace(".png", "")) >
        parseInt(b.name.replace(".png", ""))
          ? 1
          : -1
      );
    mask_files = [].slice
      .call(mask_files)
      .sort((a, b) =>
        parseInt(a.name.replace(".p", "")) > parseInt(b.name.replace(".p", ""))
          ? 1
          : -1
      );

    let smc = [];
    // Get Object URL to display slices
    for (let i = 0; i < slice_files.length; i++) {
      smc.push([URL.createObjectURL(slice_files[i]), ""]);
    }
    let slice_files_paths = slice_files.map((item) => item.path);
    initialize(slice_files_paths, smc, mask_files, directory_name);

    // Update state with loaded files
    const logInfo = props.RP.logInfo.concat(
      <LogMessage
        type="success"
        message={
          "You succesfully loaded the files from directory " +
          String(directory_name) +
          " in EditorXR!"
        }
      />
    );
    props.RP.setlogInfo(logInfo);
    props.RP.setRadiPOPstates({
      files: slice_files,
      slice_mask_container: smc,
      currentSliceIndex: 0,
      patient: directory_name,
    });
    props.RP.setshowMask(false);
  };

  //Show masks after all pickle files were converted
  let numberOfConvertedMasksHelper = 0;
  const [numberOfConvertedMasks, setnumberOfConvertedMasks] = useState(0);
  useEffect(() => {
    if (
      props.RP.flaskIntialized &&
      numberOfConvertedMasks === props.RP.RadiPOPstates.files.length
    ) {
      props.RP.setshowMask(true);
      const logInfo = props.RP.logInfo.concat(
        <LogMessage type="success" message={"Loaded all mask files"} />
      );
      props.RP.setlogInfo(logInfo);
    }
    if (
      numberOfConvertedMasks > 0 &&
      numberOfConvertedMasks < props.RP.RadiPOPstates.files.length &&
      numberOfConvertedMasks % 50 === 0
    ) {
      const logInfo = props.RP.logInfo.concat(
        <LogMessage
          type="warning"
          message={
            "Loaded " +
            String(numberOfConvertedMasks) +
            " of " +
            String(props.RP.RadiPOPstates.files.length) +
            " mask files"
          }
        />
      );
      props.RP.setlogInfo(logInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfConvertedMasks]);
  const [CorrectParitionButtonLabel, setCorrectParitionButtonLabel] = useState(
    "Correct Partition"
  );
  const [state, setState] = useState({
    low_clip: props.RP.low_clip,
    high_clip: props.RP.high_clip,
    showDialog: false,
    files: [],
  });

  /**
   * Reset mask: Request mask for current slice from Flask server
   * @memberof Toolbar
   * @method resetMask
   */
  const resetMask = () => {
    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      index: props.RP.RadiPOPstates.currentSliceIndex,
    };
    fetch(props.RP.FLASK_SERVER + "/getMask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let bytestring = data["mask"];
        let img = bytestring.split("'")[1];
        img = "data:image/png;base64," + img;
        props.RP.setNewMask(img);
        console.log("reset");
      })
      .catch(error_handler);
  };

  /**
   * Correct Partition: Sends coordinates of last mouse clicks to Flask server.
   * Receives new mask with corrected partition and sets it to the current slice
   * @memberof ToolBar
   * @method correctPartition
   */
  const correctPartition = () => {
    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      coordinates: props.RP.selectedPoints,
      index: props.RP.RadiPOPstates.currentSliceIndex,
    };
    fetch(props.RP.FLASK_SERVER + "/correctPartition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let bytestring = data["mask"];
        let img = bytestring.split("'")[1];
        img = "data:image/png;base64," + img;
        props.RP.setNewMask(img);
        const logInfo = props.RP.logInfo.concat(
          <LogMessage
            type="success"
            message={
              "Corrections for mask of slice " +
              String(props.RP.RadiPOPstates.currentSliceIndex + 1) +
              " were accepted"
            }
          />
        );
        props.RP.setlogInfo(logInfo);
      })
      .catch(error_handler);
  };

  /**
   * Handles event when "Correct Partition" button was pressed
   * @memberof ToolBar
   * @method handleCorrectPartition
   * @param {*} event Event
   */
  const handleCorrectPartition = (event) => {
    if (props.RP.RadiPOPstates.files.length === 0) {
      return;
    }
    const highlight = !props.RP.highlightMode;
    props.RP.sethighlightMode(highlight);
    if (highlight) {
      setCorrectParitionButtonLabel("Correct Partition");
      props.RP.setselectedPoints([]);
      resetMask();
    } else {
      setCorrectParitionButtonLabel("Exit correction mode");
    }
  };

  /**
   * Handles event when commit correction button was pressed
   * @memberof ToolBar
   * @method handleCommitCorrections
   * @param {*} event Event
   */
  const handleCommitCorrections = (event) => {
    if (props.RP.RadiPOPstates.files.length === 0) {
      return;
    }
    if (props.RP.selectedPoints.length > 2) {
      console.log("Commited changes");
      correctPartition();
      setCorrectParitionButtonLabel("Correct Partition");
      props.RP.sethighlightMode(true);
      props.RP.setselectedPoints([]);
    }
  };

  /**
   * Handles event when clear edits button was pressed
   * @memberof ToolBar
   * @method handleClearEdits
   * @param {*} event Event
   */
  const handleClearEdits = (event) => {
    if (props.RP.RadiPOPstates.files.length === 0) {
      return;
    }
    props.RP.setselectedPoints([]);
    resetMask();
  };

  /**
   * Handles event when dcm2png button was pressed
   * User selects files which are then converted to png
   * @memberof ToolBar
   * @method dcm2pngDialog
   * @param {*} event Event
   */
  const dcm2pngDialog = (event) => {
    console.log("dcm2png button was clicked");
    let files = event.target.files;
    let dcm_files = [];
    for (let i = 0; i < files.length; i++) {
      //dcm filename must not start with . or _ --> issue especially on windows
      if (files[i].name.match(/^(?!(\.|_)).*\.dcm/g)) {
        dcm_files.push(files[i].path);
      }
    }
    if (dcm_files.length === 0) {
      const logInfo = props.RP.logInfo.concat(
        <LogMessage
          type="error"
          message="No .dcm files were found in the selected directory."
        />
      );
      props.RP.setlogInfo(logInfo);
      return;
    }
    props.RP.setDisableApp(true);
    setState({
      showDialog: !state.showDialog,
      low_clip: state.low_clip,
      high_clip: state.high_clip,
      files: dcm_files,
    });
    //In order to be able to call dcm2png again on same dir -> event must change
    event.target.value = "";
  };

  /**
   * Handles event when save button was pressed.
   * Makes request to Flask server
   * and saves masks to .p files in the input directory.
   * @memberof ToolBar
   * @method saveHandler
   * @param {*} event Event
   */
  const saveHandler = (event) => {
    if (props.RP.RadiPOPstates.files.length === 0) {
      return;
    }
    //Deciding whether output path is in unix or windows style --> delimiter
    let delimiter =
      props.RP.RadiPOPstates.files[0].path.charAt(0) === "/" ? "/" : "\\";
    let outpath = props.RP.RadiPOPstates.files[0].path.substring(
      0,
      props.RP.RadiPOPstates.files[0].path.lastIndexOf(delimiter) + 1
    );

    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      path: outpath,
    };
    fetch(props.RP.FLASK_SERVER + "/saveMasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let logInfo = props.RP.logInfo.concat(
          <LogMessage type="success" message={data["message"]} />
        );
        props.RP.setlogInfo(logInfo);
      })
      .catch(error_handler);
  };

  // preview contains preview for slice used by <Dcm2PngWindow/>

  const [preview, setpreview] = useState("");

  return (
    <div className="row toolbar col-lg-12 col-md-12">
      <div className="brwhite tool-col col-lg-3 col-md-3">
        <Input
          RP={props.RP}
          key="OpenButton"
          label="Open"
          myChange={openHandler}
        />{" "}
        <Input
          RP={props.RP}
          key="dcm2png"
          label="dcm2png"
          myChange={dcm2pngDialog}
        />{" "}
        <Button
          RP={props.RP}
          key="SaveButton"
          label="Save"
          myClick={saveHandler}
        />{" "}
      </div>{" "}
      <div className="tool-col col-lg-7 col-md-7">
        <Button
          RP={props.RP}
          key="CorrectPartitionButton"
          label={CorrectParitionButtonLabel}
          myClick={handleCorrectPartition}
        />{" "}
        <Button
          RP={props.RP}
          key="CommitCorrectionsButton"
          label="Commit corrections"
          myClick={handleCommitCorrections}
        />{" "}
        <Button
          RP={props.RP}
          key="ClearEditsButton"
          label="Clear edits"
          myClick={handleClearEdits}
        />{" "}
      </div>{" "}
      <div className="blwhite tool-col col-lg-2 col-md-2">
        <SearchBar RP={props.RP} scrollRefs={props.RP.scrollRefs} />{" "}
      </div>{" "}
      {/* Show Modal - Renders Outside React Hierarchy Tree
        via Portal Pattern */}{" "}
      {state.showDialog === true ? (
        <Dcm2PngWindow
          RP={props.RP}
          state={state}
          setState={setState}
          preview={preview}
          setpreview={setpreview}
        />
      ) : null}{" "}
    </div>
  );
}

export default ToolBar;
