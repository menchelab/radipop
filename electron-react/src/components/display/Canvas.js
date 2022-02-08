import React from 'react';
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

  const highlightOrgan = (rel_x, rel_y) => {
    let data={
      "patientID": props.RadiPOPstates.patient,
      "x": rel_x,
      "y": rel_y,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch(window.RP_vars.FLASK_SERVER+"/highlightOrgan", {
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
   const drawOnMask = (coordinates) => {
    let data={
      "patientID": props.RadiPOPstates.patient,
      "index": props.RadiPOPstates.currentSliceIndex,
      "coordinates": coordinates
    };
    fetch(window.RP_vars.FLASK_SERVER+"/drawOnMask", {
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
     <div className="canvas" >
      <img className="img" src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][0]}  alt="CT slice for editing"/>
      {props.RadiPOPstates.showMask  && props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][1]!=="" &&
        <img className="canvasmask"
        src={props.RadiPOPstates.slice_mask_container[props.RadiPOPstates.currentSliceIndex][1]}
        onClick={handleClick} alt="mask"/>
      }
    </div>
  );
}

export default Canvas;
