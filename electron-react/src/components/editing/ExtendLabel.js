import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';


function ExtendLabel(props){
  return(
      <button disabled={props.disableApp} onClick={props.extendLabelClick} className="button-editing">
        {props.label}
      </button>
  );
}

export default ExtendLabel;
