import React from "react";
import "../../styles/editing.css";
import "../../styles/index.css";

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
