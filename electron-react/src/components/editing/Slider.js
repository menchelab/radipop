import React from "react";
import "../../styles/editing.css";
import "../../styles/index.css";

/**
 * Component to create slider
 * @memberof editing
 * @method Slider
 * @param {*} props RP variable from App.js
 * @returns slider div
 * @example
 * <Slider id="liver" RP={props.RP} label="Liver Intensity:"
 * value={sliderValue.liver} handleSlide={handleSlide}
 * handleClickPlus={handleClickPlus} handleClickMinus={handleClickMinus}
 />
 */
function Slider(props) {
  return (
    <div>
      <span id="intensity-slider-output">
        {props.label} {props.value}
      </span>
      <div className="slidecontainer">
        <button
          disabled={props.RP.disableApp}
          id={props.id}
          className="slider-button"
          onClick={props.handleClickMinus}
        >
          -
        </button>
        <input
          disabled={props.RP.disableApp}
          id={props.id}
          type="range"
          min="0"
          max="300"
          step="5"
          value={props.value}
          className="slider"
          onChange={props.handleSlide}
        />
        <button
          disabled={props.RP.disableApp}
          id={props.id}
          className="slider-button"
          onClick={props.handleClickPlus}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Slider;
