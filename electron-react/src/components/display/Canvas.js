import React from 'react';
import '../../styles/display.css'

function Canvas(props){

  const handleClick = (event) => {
    console.log("Canvas was clicked.")
    var rel_x = event.nativeEvent.offsetX/event.target.width;
    var rel_y = event.nativeEvent.offsetY/event.target.height;
    console.log(rel_x)
    console.log(rel_y)
  }




  return(
     <div className="slice-mask-container" >
      <img className="img" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][0]}  onClick={handleClick} alt="CT slice for editing"/>
      {props.RadiPOPstates.showMask  && <img className="mask" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][1]} alt="mask"/> }
    </div>
  );
}

export default Canvas;
