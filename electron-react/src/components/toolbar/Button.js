import React from 'react';
import '../../styles/toolbar.css';

/**
 * Creates a button element for Toolbar
 * @memberof toolbar
 * @method Button 
 * @param {*} props RP variable from App.js
 * @returns button
 * @example
 * <Button RP={props.RP} key="CorrectPartitionButton" label={CorrectParitionButtonLabel} myClick={handleCorrectPartition} />
 */

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
