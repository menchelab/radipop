import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';


function SetLabel(props){
  return(
      <button className="button-editing">
        {props.label}
      </button>
  );
}

export default SetLabel;
