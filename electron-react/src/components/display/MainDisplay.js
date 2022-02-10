import React from 'react';
import Info from '../display/Info.js';
import Canvas from '../display/Canvas.js';
import '../../styles/display.css';
import '../../styles/index.css';
import Log from '../../components/log/LogInfo.js';



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
