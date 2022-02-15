import React from 'react';
import '../../styles/display.css';
import '../../styles/index.css';
import preview from '../../assets/images/preview_placeholder.png';



function MiniCanvas(props) {


  const clickImage = () => {
   props.RP.setRadiPOPstates({
     files: props.RP.RadiPOPstates.files,
     slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
     currentSliceIndex: parseInt(props.index),
     patient: props.RP.RadiPOPstates.patient
    })
  }

  return(
    <div className="slice-mask-container" onClick={clickImage} >
       {props.RP.flaskIntialized && <div className="bottom-right"> {props.index+1} </div>}
      <img
        src={props.RP.RadiPOPstates.files.length?props.slice_mask_container[0]:preview}
        alt="Slices"
        ref={props.test}
        className={`img${props.RP.RadiPOPstates.currentSliceIndex === props.index ? 'selected' : ''} undraggable`}
      />
    {props.RP.showMask && props.slice_mask_container[1]!=="" && <img className="mask undraggable" src={props.slice_mask_container[1]} alt="mask" />}
    {}
    </div>
  );
}

export default MiniCanvas;
