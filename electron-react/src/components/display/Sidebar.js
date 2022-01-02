import React, {useState} from 'react';
import MiniCanvas from '../display/MiniCanvas.js';

import '../../styles/display.css';
import '../../styles/index.css';



function Sidebar(props){
    return(
      <div className="scrollbar-area col-lg-3 col-md-3">
        <span style={{textAlign: "center"}}>Slice Preview</span>
 
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
  );
}

export default Sidebar;
