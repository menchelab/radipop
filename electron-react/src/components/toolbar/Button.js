import React from 'react';
import '../../styles/toolbar.css';

function Button(props) {
    return (
    <button onClick={props.myClick} style={{backgroundColor: props.color, border: props.borderColor}} className="button-10">
      {props.label}
    </button>
    );
  };

export default Button;
