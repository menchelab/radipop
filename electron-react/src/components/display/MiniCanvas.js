import React from 'react';
import '../../styles/display.css';
import '../../styles/index.css';
import preview from '../../assets/images/preview_placeholder.png';



function MiniCanvas(props) {


  const clickImage = () => {
   props.setRadiPOPstates({
     files: props.RadiPOPstates.files,
     slice_mask_container: props.RadiPOPstates.slice_mask_container,
     currentSliceIndex: parseInt(props.index),
     patient: "?",
     showMask: props.RadiPOPstates.showMask,
     status: props.RadiPOPstates.status,
    })
  }

  return(
    <div className="slice-mask-container" onClick={clickImage} >
      <img
        src={props.RadiPOPstates.files.length?props.slice_mask_container[0]:preview}
        alt="Slices"
        className={`img${props.RadiPOPstates.currentSliceIndex === props.index ? 'selected' : ''}`}
      />
    {props.RadiPOPstates.showMask && <img className="mask" src={props.slice_mask_container[1]} alt="mask"/>}
    </div>
  );
}

export default MiniCanvas;
