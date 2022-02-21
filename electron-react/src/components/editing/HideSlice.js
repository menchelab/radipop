import React from "react";
import "../../styles/editing.css";
//import LogMessage from '../log/LogMessage';

function HideSlice(props) {
  const loaded_files = props.RP.RadiPOPstates.files.length === 0;
  // Set state hide slice on checkbox click
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
