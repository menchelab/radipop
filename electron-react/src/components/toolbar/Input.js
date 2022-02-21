import React from 'react';
import '../../styles/toolbar.css';

/**
 * Creates Input element for Toolbar (e.g.: Open, dcm2png)
 * @memberof toolbar
 * @method Input 
 * @param {*} props RP variable from App.js
 * @returns labelled input  
 * @example
 * <Input RP={props.RP} key="OpenButton" label="Open" myChange={openHandler} />
 */

function Input(props) {
    return (
    <label className={`input-10${props.RP.disableApp === true ? "dis" : ""} `}>
      <input disabled={props.RP.disableApp} type="file" onChange={props.myChange} directory="" webkitdirectory=""/>
      {props.label}
    </label>
    );
};

export default Input;
