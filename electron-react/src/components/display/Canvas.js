import React from 'react';
import '../../styles/display.css'

function Canvas(props){
  return(
     <div className="slice-mask-container">
      <img className="img" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][0]} alt="CT slice for editing"/>
      {props.RadiPOPstates.showMask === false && <img className="mask" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][1]} alt="mask"/>}
    </div>
  );
}

export default Canvas;
