import React from "react";
import "../../styles/editing.css";

/**
 * Component to show and hide masks
 * @memberof editing
 * @method HideMask
 * @param {*} props RP variable from App.js
 * @returns span checkbox
 * @example
 * <HideMask key="HideMaskBox" RP={props.RP}/>
 */
//
function HideMask(props) {
  /**
   * @namespace HideMask
   */

  const loaded_files = props.RP.RadiPOPstates.files.length === 0;


  /**
   * Set state show mask on checkbox click, computes mask if no mask is
   * available.
   * @memberof HideMask
   * @method handleChange
   */
  const handleChange = () => {
    if (!props.RP.showMask) {
      //Not because state is set afterwards
      let index = props.RP.RadiPOPstates.currentSliceIndex;
      //Calculate new mask if current slice has no mask
      if (props.RP.RadiPOPstates.slice_mask_container[index][1] === "") {
        props.RP.setFirstMaskForSlice(index);
      }
    }
    props.RP.setRadiPOPstates({
      files: props.RP.RadiPOPstates.files,
      slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
      currentSliceIndex: props.RP.RadiPOPstates.currentSliceIndex,
      patient: props.RP.RadiPOPstates.patient,
    });
    props.RP.setshowMask(!props.RP.showMask);
  };

  return (
    <span>
      <input
        type="checkbox"
        disabled={loaded_files || props.RP.disableApp}
        checked={props.RP.showMask}
        id="hide-mask-checkbox"
        onChange={handleChange}
        name="hide-mask-checkbox"
      />
      <label style={{ paddingLeft: "5px" }} htmlFor="hide-mask-checkbox">
        Show mask
      </label>
    </span>
  );
}

export default HideMask;
