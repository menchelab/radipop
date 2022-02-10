import React from 'react';
import '../../styles/display.css'

function Canvas(props){

  const handleClick = (event) => {
    let rel_x = event.nativeEvent.offsetX/event.target.width;
    let rel_y = event.nativeEvent.offsetY/event.target.height;
    if (props.RP.highlightMode){
      highlightOrgan(rel_x,rel_y);
    }
    else {
      const coor= props.RP.selectedPoints;
      coor.push(rel_x);
      coor.push(rel_y);
      props.RP.setselectedPoints(coor);
      drawOnMask(coor);
    }

  }

  const highlightOrgan = (rel_x, rel_y) => {
    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "x": rel_x,
      "y": rel_y,
      "index": props.RP.RadiPOPstates.currentSliceIndex
    };
    fetch(props.RP.FLASK_SERVER+"/highlightOrgan", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      props.RP.setNewMask(img);
    })
  }

   //Draw on mask
   const drawOnMask = (coordinates) => {
    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "index": props.RP.RadiPOPstates.currentSliceIndex,
      "coordinates": coordinates
    };
    fetch(props.RP.FLASK_SERVER+"/drawOnMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})
    .then(function(data){
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img="data:image/png;base64," + img;
      props.RP.setNewMask(img);
    })
  }


  return(
     <div className="canvas" >
      <img className="image undraggable" src={props.RP.RadiPOPstates.slice_mask_container[props.RP.RadiPOPstates.currentSliceIndex][0]}  alt="CT slice for editing"/>
      {props.RP.RadiPOPstates.showMask  && props.RP.RadiPOPstates.slice_mask_container[props.RP.RadiPOPstates.currentSliceIndex][1]!=="" &&
        <img className="canvasmask undraggable"
        src={props.RP.RadiPOPstates.slice_mask_container[props.RP.RadiPOPstates.currentSliceIndex][1]}
        onClick={handleClick} alt="mask"/>
      }
    </div>
  );
}

export default Canvas;
