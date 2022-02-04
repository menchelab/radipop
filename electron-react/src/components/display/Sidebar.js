import React from 'react';
import MiniCanvas from '../display/MiniCanvas.js';

import '../../styles/display.css';
import '../../styles/index.css';



function Sidebar(props){
    return(
      <div className="heading col-lg-2 col-md-2">
        <span style={{textAlign: "center"}}>Slice Preview</span>
        <div className="scrollbar-area col-lg-12 col-md-12">
        {props.RadiPOPstates.slice_mask_container.map((smc,index) => {
        return <MiniCanvas
          index={index}
          key={index}
          slice_mask_container={smc}
          RadiPOPstates={props.RadiPOPstates}
          setRadiPOPstates={p=>{props.setRadiPOPstates(p)}}
          />
        })}
        </div>
      </div>
  );
}

export default Sidebar;
