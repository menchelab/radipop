import React from "react";
import "../../styles/editing.css";

/**
 * Component to show and hide slice
 * @memberof editing
 * @method HideSlice
 * @param {*} props RP variable from App.js
 * @returns span checkbox
 * @example
 * <HideSlice key="HideSliceBox" RP={props.RP} />
 */
function HideSlice(props) {
  /**
   * @namespace HideSlice
   */

  const loaded_files = props.RP.RadiPOPstates.files.length === 0;
  /**
   * Set state hide slice on checkbox click.
   * @memberof HideSlice
   * @method handleChange
   */
  const handleChange = () => {
    props.RP.setshowSlice(!props.RP.showSlice);
  };

  return (
    <span>
      <input
        type="checkbox"
        disabled={loaded_files || props.RP.disableApp}
        checked={props.RP.showSlice}
        id="hide-slice-checkbox"
        onChange={handleChange}
        name="hide-slice-checkbox"
      />
      <label style={{ paddingLeft: "5px" }} htmlFor="hide-slice-checkbox">
        Show slice
      </label>
    </span>
  );
}

export default HideSlice;
