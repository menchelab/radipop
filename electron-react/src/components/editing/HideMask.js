import React from 'react';
import '../../styles/editing.css';

function HideMask(props) {

  // Set state hide mask on checkbox click
  const handleChange = () => {
    let logInfo = "";
    if (props.RadiPOPstates.showMask === true){
       logInfo = props.RadiPOPstates.status.concat("Masks are visible");
    }
    if(props.RadiPOPstates.showMask === false){
       logInfo = props.RadiPOPstates.status.concat("Masks are hidden");
    }
    props.setRadiPOPstates({files: props.RadiPOPstates.files, slice_mask_container: props.RadiPOPstates.slice_mask_container, currentSliceIndex:props.RadiPOPstates.currentSliceIndex, patient:"?", showMask: !props.RadiPOPstates.showMask, status: logInfo});
}

    return (
      <div className="toolsh">
        <input type="checkbox" id="hide-mask-checkbox" onChange={handleChange} name="hide-mask-checkbox" />
        <label style={{paddingLeft: "5px"}} htmlFor="hide-mask-checkbox">Show mask</label>
      </div>
    );
  };

export default HideMask;
