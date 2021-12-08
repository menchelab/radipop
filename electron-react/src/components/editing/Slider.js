
import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';

function Slider(props) {
    return (
      <div>
        {props.label} <span id="intensity-slider-output">180</span>
        <div className="slidecontainer">
            <button id="slider-minus">-</button>
            <input type="range" min="1" max="300" defaultValue="180" className="slider" id="sliderx"/>
            <button id="slider-plus">+</button>
        </div>
      </div>
    );
  };

export default Slider;
