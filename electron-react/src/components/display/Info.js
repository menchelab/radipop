import React from 'react';

function Info(props){

  return(
    <div className="Info">
      <span> Patient: {props.RP.RadiPOPstates.patient} </span>
      <span> Slice: {props.RP.RadiPOPstates.currentSliceIndex + 1} </span>
      <span> Number of slices: {props.RP.RadiPOPstates.files.length} </span>
    </div>
  );
}

export default Info;


// <span> Slice: {props.RP.RadiPOPstates.currentSliceIndex} </span>
// <span> Number of slices: {props.RP.RadiPOPstates.files.length} </span>
