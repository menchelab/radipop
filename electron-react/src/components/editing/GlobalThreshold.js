import React from "react";
import "../../styles/editing.css";

/**
 * Component to compute new masks using slider thresholds
 * @memberof editing
 * @method GlobalThreshold
 * @param {*} props RP variable from App.js
 * @param {*} props setThesholdGlobally callback to editing
 * @returns button
 * @example
 * <GlobalThreshold label="Set threshold globally"
 * setThesholdGlobally={setThesholdGlobally} RP={props.RP}/>
 */
function GlobalThreshold(props) {
  return (
    <button
      disabled={props.RP.disableApp}
      className={`button-editing${props.RP.disableApp === true ? "dis" : ""} `}
      onClick={props.setThesholdGlobally}
    >
      {props.label}
    </button>
  );
}

export default GlobalThreshold;
