import React, {createRef} from 'react';
import MiniCanvas from '../display/MiniCanvas.js';

import '../../styles/display.css';
import '../../styles/index.css';



function Sidebar(props){
     props.scrollRefs.current = [...Array(props.RadiPOPstates.files.length).keys()].map(
       (_, i) => props.scrollRefs.current[i] ?? createRef()
     );

    return(
      <div className="heading col-lg-2 col-md-2">
        <span style={{textAlign: "center"}}>Slice Preview</span>
        <div className="scrollbar-area col-lg-12 col-md-12">
        {props.RadiPOPstates.slice_mask_container.map((smc,index) => {
        return <MiniCanvas
          index={index}
          test={props.scrollRefs.current[index]}
          key={"sidebar_minicanvas"+index}
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
