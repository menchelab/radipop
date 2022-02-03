import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';


function SetLabel(props){

  const handleClick = (event) =>{
    console.log(props.labelID);
    labelOrgan(props.labelID)
  }

  const labelOrgan = (label, patientID="1") => {
    let data={
      "patientID": patientID,
      "label": label,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch("http://localhost:4041"+"/labelOrgan", {
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
  return(
      <button onClick={handleClick} className="button-editing">
        {props.label}
      </button>
  );
}

export default SetLabel;
