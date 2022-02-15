import React from 'react';
import '../../styles/editing.css';
import LogMessage from '../log/LogMessage';

function HideMask(props) {
  const loaded_files = (props.RP.RadiPOPstates.files.length === 0)
  // Set state hide mask on checkbox click
  const handleChange = () => {
    let logInfo = "";
    if (!props.RP.showMask){ //Not because state is set afterwards
       logInfo = props.RP.logInfo.concat(<LogMessage type="warning" message="Masks are visible"/>);
    }
    else{
       logInfo = props.RP.logInfo.concat(<LogMessage type="warning" message="Masks are hidden"/>);

    }
    props.RP.setlogInfo(logInfo);
    props.RP.setRadiPOPstates({files: props.RP.RadiPOPstates.files,
      slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
      currentSliceIndex:props.RP.RadiPOPstates.currentSliceIndex,
      patient: props.RP.RadiPOPstates.patient
    });
    props.RP.setshowMask(!props.RP.showMask); 
}

    return (
      <div className="toolsh">
        <input type="checkbox"
               disabled={loaded_files || props.RP.disableApp}
               checked={props.RP.showMask}
               id="hide-mask-checkbox"
               onChange={handleChange}
               name="hide-mask-checkbox" />
        <label style={{paddingLeft: "5px"}} htmlFor="hide-mask-checkbox">Show mask</label>
      </div>
    );
  };

export default HideMask;
