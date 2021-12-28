import React from 'react';

function Info(props){

  return(
    <div className="Info">
      <span> Patient X </span>
      <span> Slice 1 </span>
      <span> Number of slices: {props.selectedFile.length} </span>
    </div>
  );
}

export default Info;
