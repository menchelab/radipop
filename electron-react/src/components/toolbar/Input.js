import React from 'react';
import '../../styles/toolbar.css';

function Input(props) {
    return (
    <label className="input-10">
      <input type="file" onChange={props.myChange}/>
      {props.label}
    </label>
    );
};

export default Input;
