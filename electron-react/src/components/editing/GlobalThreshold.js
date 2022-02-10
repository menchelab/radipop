import React from 'react';
import '../../styles/editing.css';
//disabled={props.disableApp}
function GlobalThreshold(props) {
    return (
    <button disabled={props.RP.disableApp}
            className={`button-editing${props.RP.disableApp === true ? "dis" : ""} `}
            onClick={props.setThesholdGlobally}>
      {props.label}
    </button>
    );
  };

export default GlobalThreshold;
