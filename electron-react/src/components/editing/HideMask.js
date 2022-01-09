import React from 'react';
import '../../styles/editing.css';

function HideMask(props) {
  // Set state hide mask on checkbox click
  const handleChange = () => {
    props.setRadiPOPstates({files: props.RadiPOPstates.files, slice_mask_container: props.RadiPOPstates.slice_mask_container, currentSliceIndex:props.RadiPOPstates.currentSliceIndex, patient:"?", showMask: !props.RadiPOPstates.showMask});
    console.log(props.RadiPOPstates.showMask)
}

    return (
      <div className="toolsh">
        <input type="checkbox" id="hide-mask-checkbox" onChange={handleChange} name="hide-mask-checkbox" />
        <label style={{paddingLeft: "5px"}} htmlFor="hide-mask-checkbox">Show mask</label>
      </div>
    );
  };

export default HideMask;
