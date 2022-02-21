import React from "react";
import "../../styles/editing.css";
import "../../styles/index.css";

/**
 * Component to extend labels on neighbour slices
 * @memberof editing
 * @method ExtendLabel
 * @param {*} props RP variable from App.js
 * @param {*} props extendLabelClick callback to bound/editing
 * @returns button
 * @example
 *   <ExtendLabel label="Extend Label" RP={props.RP}
 *   extendLabelClick={props.extendLabelClick}/>
 */
function ExtendLabel(props) {
  return (
    <button
      disabled={props.RP.disableApp}
      onClick={props.extendLabelClick}
      className={`button-editing${props.RP.disableApp === true ? "dis" : ""} `}
    >
      {props.label}
    </button>
  );
}

export default ExtendLabel;
