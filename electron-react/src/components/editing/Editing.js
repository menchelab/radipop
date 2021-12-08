import React from 'react';
import HideMask from '../editing/HideMask.js';
import Slider from '../editing/Slider.js'
import GlobalThreshold from '../editing/GlobalThreshold.js';
import Bound from '../editing/Bound.js';
import SetLabel from '../editing/SetLabel.js';
import '../../styles/editing.css';
import '../../styles/index.css';



class Editing extends React.Component {
  render() {
    return(
      <div className="utility-area col-lg-3 col-md-3">
        <HideMask/>
        <div className="tools">
          <Slider label="Bone Intensity:"/>
          <Slider label="Vessel Intensity:"/>
          <Slider label="Liver Intensity:"/>
          <GlobalThreshold label="Set thresholds globally"/>
        </div>
        <Bound/>
        <SetLabel label="Set Liver Label"/>
        <SetLabel label="Set Spleen Label"/>
      </div>
  );
  }
}

export default Editing;
