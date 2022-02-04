import React, {useState, useEffect} from 'react';
import '../../styles/display.css'

function Canvas(props){

  const handleClick = (event) => {
    let rel_x = event.nativeEvent.offsetX/event.target.width;
    let rel_y = event.nativeEvent.offsetY/event.target.height;
    if (window.RP_vars.highlightMode){
      highlightOrgan(rel_x,rel_y);
    }
    else {
      window.RP_vars.selectedPoints.push(rel_x);
      window.RP_vars.selectedPoints.push(rel_y);
      drawOnMask(window.RP_vars.selectedPoints);
    }

  }

  const highlightOrgan = (rel_x, rel_y, patientID="1") => {
    let data={
      "patientID": patientID,
      "x": rel_x,
      "y": rel_y,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch("http://localhost:4041"+"/highlightOrgan", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      window.RP_vars.setNewMask(img);
    })
  }

   //Draw on mask
   const drawOnMask = (coordinates,patientID="1") => {
    let data={
      "patientID": patientID,
      "index": props.RadiPOPstates.currentSliceIndex,
      "coordinates": coordinates
    };
    fetch("http://localhost:4041"+"/drawOnMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})
    .then(function(data){
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img="data:image/png;base64," + img;
      window.RP_vars.setNewMask(img);
    })
  }


  return(
     <div className="slice-mask-container" >
      <img className="img" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][0]}  alt="CT slice for editing"/>
      {props.RadiPOPstates.showMask  &&
        <img className="mask"
        src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][1]}
        onClick={handleClick} alt="mask"/>
      }
    </div>
  );
}

export default Canvas;
