import React from 'react';
import '../../styles/toolbar.css';

function Button(props) {
    return (
    <button disabled={props.RP.disableApp}
            onClick={props.myClick}
            style={{backgroundColor: props.color, border: props.borderColor}}
            className={`button-10${props.RP.disableApp === true ? "dis" : ""} `}>
      {props.label}
    </button>
    );
  };

export default Button;
