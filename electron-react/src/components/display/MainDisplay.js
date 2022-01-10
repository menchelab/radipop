import React from 'react';
import Info from '../display/Info.js';
import Canvas from '../display/Canvas.js';
import '../../styles/display.css';
import '../../styles/index.css';
import Log from '../../components/log/LogInfo.js';



function MainDisplay(props) {
    return(
      <div className="col-lg-6 col-md-6 display-area">
        <Info RadiPOPstates={props.RadiPOPstates}/>
        <Canvas RadiPOPstates={props.RadiPOPstates}/>
        <Log RadiPOPstates={props.RadiPOPstates}/>
      </div>
  );
}

export default MainDisplay;
