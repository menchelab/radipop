import React from 'react';
import '../../styles/editing.css';
import '../../styles/index.css';


function SetLabel(props){
  

  const handleClick = (event) =>{
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    let removelabel = props.labelID===props.RP.LIVER_LABEL?props.RP.LiverButton.remove:props.RP.SpleenButton.remove
    if (removelabel) {
      labelOrgan(-1);
      props.RP.setLiverButton({label:"Set liver label", remove: false})
      props.RP.setSpleenButton({label:"Set spleen label",remove: false});
    }
    else {
      labelOrgan(props.labelID)
    }
  }

  const labelOrgan = (label) => {
    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "label": label,
      "index": props.RP.RadiPOPstates.currentSliceIndex
    };
    fetch(props.RP.FLASK_SERVER+"/labelOrgan", {
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


  return(
      <button disabled={props.RP.disableApp}
              onClick={handleClick}
              className={`button-editing${props.RP.disableApp === true ? "dis" : ""} `}>
        {props.labelID===props.RP.LIVER_LABEL?props.RP.LiverButton.label:props.RP.SpleenButton.label}
      </button>
  );
}

export default SetLabel;
