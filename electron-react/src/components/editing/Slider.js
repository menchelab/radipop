
import React, {useState, useEffect} from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';

function Slider(props) {

  return (
      <div>
     <span id="intensity-slider-output">{props.label} {props.value}</span>
        <div className="slidecontainer">
            <button id={props.id}className="slider-button" onClick={props.handleClickMinus}>-</button>
            <input id={props.id} type="range" min="0" max="300" step="5" value={props.value} className="slider" onChange={props.handleSlide}/>
            <button id={props.id} className="slider-button" onClick={props.handleClickPlus}>+</button>
        </div>
      </div>
    );
  };

export default Slider;
