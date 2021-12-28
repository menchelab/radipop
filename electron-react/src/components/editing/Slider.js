
import React, {useState} from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';

function Slider(props) {
  // Slider state variable
  const [value, setValue] = useState('180');
  // Update state "value" on slider change
  const handleSlide = (event) => {
      setValue(parseInt(event.target.value,10));
  }
  const handleClickPlus = (event) => {
    if(parseInt(value, 10) < 300)
      setValue(parseInt(value, 10) + 1);
  }

  const handleClickMinus = (event) => {
    if(parseInt(value, 10) > 1)
      setValue(parseInt(value,10) - 1);
  }


  return (
      <div>
     <span id="intensity-slider-output">{props.label} {value}</span>
        <div className="slidecontainer">
            <button className="slider-button" onClick={handleClickMinus}>-</button>
            <input type="range" min="0" max="300" step="5" value={value} className="slider" onChange={handleSlide} id="sliderx"/>
            <button className="slider-button" onClick={handleClickPlus}>+</button>
        </div>
      </div>
    );
  };

export default Slider;
