import React from "react";
import "../../styles/editing.css";
import "../../styles/index.css";

/**
 * Component to set the labels liver/spleen
 * @memberof editing
 * @method HideSlice
 * @param {*} props RP variable from App.js
 * @param {*} props RP variable LIVER_LABEL or SPLEEN_LABEL from App.js
 * @returns button
 * @example
 * <SetLabel labelID={props.RP.LIVER_LABEL} RP={props.RP} />
 */
function SetLabel(props) {
  /**
   * @namespace SetLabel
   */

  /**
   * Set label on area.
   * @memberof SetLabel
   * @method handleClick
   * @param {*} event onClick Event
   */
  const handleClick = (event) => {
    if (props.RP.RadiPOPstates.files.length === 0) {
      return;
    }
    let removelabel =
      props.labelID === props.RP.LIVER_LABEL
        ? props.RP.LiverButton.remove
        : props.RP.SpleenButton.remove;
    if (removelabel) {
      labelOrgan(-1);
    } else {
      labelOrgan(props.labelID);
    }
    props.RP.setLiverButton({ label: "Set liver label", remove: false });
    props.RP.setSpleenButton({ label: "Set spleen label", remove: false });
  };

  /**
   * Computes highlighted mask and sets the state with setNewMask
   * @memberof SetLabel
   * @method labelOrgan
   * @param {*} label label Label of organ (1 for liver, 2 for spleen,
   * 0 nothing, >2 other organ)
   */
  const labelOrgan = (label) => {
    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      label: label,
      index: props.RP.RadiPOPstates.currentSliceIndex,
    };
    fetch(props.RP.FLASK_SERVER + "/labelOrgan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let bytestring = data["mask"];
        let img = bytestring.split("'")[1];
        img = "data:image/png;base64," + img;
        props.RP.setNewMask(img);
      });
  };

  return (
    <button
      disabled={props.RP.disableApp}
      onClick={handleClick}
      className={`button-editing${props.RP.disableApp === true ? "dis" : ""} `}
    >
      {props.labelID === props.RP.LIVER_LABEL
        ? props.RP.LiverButton.label
        : props.RP.SpleenButton.label}
    </button>
  );
}

export default SetLabel;
