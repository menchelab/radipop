import React from 'react';
import '../../styles/editing.css';
import LogMessage from '../log/LogMessage';

function HideMask(props) {
  const loaded_files = (props.RadiPOPstates.files.length === 0)
  // Set state hide mask on checkbox click
  const handleChange = () => {
    let logInfo = "";
    if (!props.RadiPOPstates.showMask){ //Not because state is set afterwards
       logInfo = window.RP_vars.logInfo.concat(<LogMessage type="warning" message="Masks are visible"/>);
    }
    else{
       logInfo = window.RP_vars.logInfo.concat(<LogMessage type="warning" message="Masks are hidden"/>);
       
    }
    window.RP_vars.setlogInfo(logInfo);
    props.setRadiPOPstates({files: props.RadiPOPstates.files,
      slice_mask_container: props.RadiPOPstates.slice_mask_container,
      currentSliceIndex:props.RadiPOPstates.currentSliceIndex,
      patient: props.RadiPOPstates.patient,
      showMask: !props.RadiPOPstates.showMask
    });
}

    return (
      <div className="toolsh">
        <input type="checkbox"
               disabled={loaded_files}
               checked={props.RadiPOPstates.showMask}
               id="hide-mask-checkbox"
               onChange={handleChange}
               name="hide-mask-checkbox" />
        <label style={{paddingLeft: "5px"}} htmlFor="hide-mask-checkbox">Show mask</label>
      </div>
    );
  };

export default HideMask;
