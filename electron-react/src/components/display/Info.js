import React from "react";

/**
 * Component to display information to the user: Current directory name,
 * selected slice number, and the number of slices in the directory.
 * @memberof display
 * @method Info
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 * <Info key="Info" RP={props.RP}/>
 */
function Info(props) {
  return (
    <div className="Info">
      <span> Patient: {props.RP.RadiPOPstates.patient} </span>
      <span> Slice: {props.RP.RadiPOPstates.currentSliceIndex + 1} </span>
      <span> Number of slices: {props.RP.RadiPOPstates.files.length} </span>
    </div>
  );
}

export default Info;
