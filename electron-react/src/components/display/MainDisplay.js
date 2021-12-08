import React from 'react';
import Info from '../display/Info.js';
import Canvas from '../display/Canvas.js';
import '../../styles/display.css';
import '../../styles/index.css';
import Log from '../../components/log/LogInfo.js';



class MainDisplay extends React.Component {
  render() {
    return(
      <div className="col-lg-6 col-md-6 display-area">
        <Info/>
        <Canvas/>
        <Log/>
      </div>
  );
  }
}

export default MainDisplay;
