import React from "react";
import DialogModal from "../toolbar/DialogModal.js";
import LogMessage from "../log/LogMessage.js";
import "../../styles/toolbar.css";
import "../../styles/index.css";

/**
 * Creates a window for the dcm2png conversion dialog
 * @memberof toolbar
 * @method Dcm2PngWindow
 * @param {*} props RP variable from App.js, state, setState, preview, setPreview from Toolbar.js
 * @returns DialogModal
 * @example
 * <Dcm2PngWindow RP={props.RP} state={state} setState ={setState} preview ={preview} setpreview={setpreview} />
 */
function Dcm2PngWindow(props) {
  /**
   * @namespace Dcm2PngWindow
   */

  /**
   * Handles event when user clicks on "Set" button in the DialogModal form
   * dcm files are converted to png
   * @memberof Dcm2PngWindow
   * @method handleDicomClips
   * @param {*} event Event
   */

  const handleDicomClips = () => {
    dcm2png(props.state.files);
    props.setpreview("");
  };
  /**
   * Makes flask request to convert the given dcm_files to png.
   * @memberof Dcm2PngWindow
   * @method dcm2png
   * @param {*} dcm_files Container with dcm files
   */
  const dcm2png = (dcm_files) => {
    // Check if user selected new files -> return if user clicked "cancel"
    let logInfo = props.RP.logInfo.concat(
      <LogMessage
        type="warning"
        message={
          "Converting " + String(dcm_files.length) + " .dcm files to png..."
        }
      />
    );
    props.RP.setlogInfo(logInfo);

    let data = {
      low_clip: +props.state.low_clip,
      high_clip: +props.state.high_clip,
      paths: dcm_files,
    };
    console.log("dcm2png");
    fetch(props.RP.FLASK_SERVER + "/dcm2png", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data["message"]);
        console.log(data["metadata"]);
        logInfo = logInfo.concat(
          <LogMessage type="success" message={data["message"]} />
        );
        props.RP.setlogInfo(logInfo);
        props.RP.setDisableApp(false);
        /*initializeWithFiles(png_files); */
      })
      .catch(error_handler);
  };
  /**
   * Handles Changes in clipping values in the dcm2png conversion Dialog
   * @memberof Dcm2PngWindow
   * @method _onChange
   * @param {*} e Event
   */
  function _onChange(e) {
    e.preventDefault();
    if (e.target.id === "low_clip") {
      props.setState({
        showDialog: props.state.showDialog,
        low_clip: e.target.value,
        high_clip: props.state.high_clip,
        files: props.state.files,
      });
    } else if (e.target.id === "high_clip") {
      props.setState({
        showDialog: props.state.showDialog,
        low_clip: props.state.low_clip,
        high_clip: e.target.value,
        files: props.state.files,
      });
    }
  }

  /**
   * Handles when user User clicks on "Set"
   * @memberof Dcm2PngWindow
   * @method _onSubmit
   * @param {*} e Event
   */
  function _onSubmit(e) {
    e.preventDefault();
    props.setState({
      showDialog: false,
      low_clip: props.state.low_clip,
      high_clip: props.state.high_clip,
      files: props.state.files,
    });
  }

  /**
   * Handles when user User clicks on "Preview"
   * Makes request to flask server to calculate a preview for first dcm file in directory
   * @memberof Dcm2PngWindow
   * @method handlePreview
   */
  function handlePreview() {
    let data = {
      low_clip: +props.state.low_clip,
      high_clip: +props.state.high_clip,
      path: props.state.files[0],
    };
    console.log("dcm2pngPreview");
    fetch(props.RP.FLASK_SERVER + "/dcm2pngPreview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data["message"]);
        console.log(data["metadata"]);
        let bytestring = data["slice"];
        let img = bytestring.split("'")[1];
        img = "data:image/png;base64," + img;
        props.setpreview(img);
        //props.RP.setDisableApp(false);
        props.setState({
          showDialog: true,
          low_clip: props.state.low_clip,
          high_clip: props.state.high_clip,
          files: props.state.files,
        });
      })
      .catch(error_handler);
  }

  /**
   * Function is raised when requests to Flask server fail for any reason:
   * Creates LogMessage \n
   * Enables App again (unfreezing)
   * @memberof Dcm2PngWindow
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
  }

  return (
    <DialogModal>
      <div className="dialog-wrapper">
        <h3>Set clipping values for dicom conversion</h3>
        <form onSubmit={_onSubmit}>
          {props.preview !== "" && (
            <div className="previewDiv">
              {" "}
              <img
                className="previewSlice"
                src={props.preview}
                alt="Preview"
              />{" "}
            </div>
          )}
          <div className="previewDiv2">
            LOW:{" "}
            <input
              type="text"
              id="low_clip"
              value={props.state.low_clip}
              onChange={_onChange}
            />{" "}
            HIGH:{" "}
            <input
              type="text"
              id="high_clip"
              value={props.state.high_clip}
              onChange={_onChange}
            />{" "}
          </div>
          <div className="previewDiv2">
            <button onClick={handlePreview}> Preview </button>
            <button onClick={handleDicomClips} type="submit">
              Set
            </button>
          </div>
        </form>
      </div>
    </DialogModal>
  );
}

export default Dcm2PngWindow;
