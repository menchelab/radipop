import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';


function SetLabel(props){
  const handleClick = (event) =>{
    labelOrgan(props.labelID)
  }

  const labelOrgan = (label) => {
    let data={
      "patientID": props.RadiPOPstates.patient,
      "label": label,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch(window.RP_vars.FLASK_SERVER+"/labelOrgan", {
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
