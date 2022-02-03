import React from 'react';
import '../../styles/editing.css';
//disabled={props.disableApp}
function GlobalThreshold(props) {
    return (
    <button className="button-editing"  onClick={props.setThesholdGlobally}>
      {props.label}
    </button>
    );
  };

export default GlobalThreshold;
