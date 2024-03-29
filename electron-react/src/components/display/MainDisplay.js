import React from 'react';
import Info from '../display/Info.js';
import Canvas from '../display/Canvas.js';
import '../../styles/display.css';
import '../../styles/index.css';
import Log from '../../components/log/LogInfo.js';

/**
 * Parent component for Info.js, Canvas.js and LogInfo.js (middle column in app).
 * @memberof display
 * @method MainDisplay
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 * <MainDisplay key="MainDisplay" RP={props.RP} />
 */
function MainDisplay(props) {
    return(
      <div className="col-lg-7 col-md-7 display-area">
        <Info key="Info" RP={props.RP}/>
        <Canvas key="Canvas" RP={props.RP}/>
        <Log key="Log" RP={props.RP}/>
      </div>
  );
}

export default MainDisplay;
