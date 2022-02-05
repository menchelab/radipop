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
     patient: props.RadiPOPstates.patient,
     showMask: props.RadiPOPstates.showMask,
     status: props.RadiPOPstates.status,
    })
  }

  
  return(
    <div className="slice-mask-container" onClick={clickImage} >
       {window.RP_vars.flaskIntialized && <div className="bottom-right"> {props.index+1} </div>}
      <img
        src={props.RadiPOPstates.files.length?props.slice_mask_container[0]:preview}
        alt="Slices"
        className={`img${props.RadiPOPstates.currentSliceIndex === props.index ? 'selected' : ''}`}
      />
    {props.RadiPOPstates.showMask && props.slice_mask_container[1]!=="" && <img className="mask" src={props.slice_mask_container[1]} alt="mask" />}
    {}
    </div>
  );
}

export default MiniCanvas;
