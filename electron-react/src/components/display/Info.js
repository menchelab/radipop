import React from 'react';

function Info(props){

  return(
    <div className="Info">
      <span> Patient X </span>
      <span> Slice: {props.RadiPOPstates.currentSliceIndex} </span>
      <span> Number of slices: {props.RadiPOPstates.files.length} </span>
    </div>
  );
}

export default Info;


// <span> Slice: {props.RadiPOPstates.currentSliceIndex} </span>
// <span> Number of slices: {props.RadiPOPstates.files.length} </span>