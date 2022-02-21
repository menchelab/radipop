import React from "react";
import "../../styles/display.css";

function Canvas(props) {
  const handleClick = (event) => {
    let rel_x = event.nativeEvent.offsetX / event.target.width;
    let rel_y = event.nativeEvent.offsetY / event.target.height;
    if (props.RP.highlightMode) {
      highlightOrgan(rel_x, rel_y);
    } else {
      const coor = props.RP.selectedPoints;
      coor.push(rel_x);
      coor.push(rel_y);
      props.RP.setselectedPoints(coor);
      drawOnMask(coor);
    }
  };

  const highlightOrgan = (rel_x, rel_y) => {
    if (props.RP.disableApp === true) {
      alert("Please wait...");
      return;
    }
    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      x: rel_x,
      y: rel_y,
      index: props.RP.RadiPOPstates.currentSliceIndex,
    };
    fetch(props.RP.FLASK_SERVER + "/highlightOrgan", {
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
        if (
          parseInt(data["PixelValueOfHighlightedArea"]) === props.RP.LIVER_LABEL
        ) {
          props.RP.setLiverButton({
            label: "Remove liver label",
            remove: true,
          });
          props.RP.setSpleenButton({
            label: "Set spleen label",
            remove: false,
          });
        } else if (
          parseInt(data["PixelValueOfHighlightedArea"]) ===
          props.RP.SPLEEN_LABEL
        ) {
          props.RP.setSpleenButton({
            label: "Remove spleen label",
            remove: true,
          });
          props.RP.setLiverButton({ label: "Set liver label", remove: false });
        } else {
          props.RP.setLiverButton({ label: "Set liver label", remove: false });
          props.RP.setSpleenButton({
            label: "Set spleen label",
            remove: false,
          });
        }
      });
  };

  //Draw on mask
  const drawOnMask = (coordinates) => {
    let data = {
      patientID: props.RP.RadiPOPstates.patient,
      index: props.RP.RadiPOPstates.currentSliceIndex,
      coordinates: coordinates,
    };
    fetch(props.RP.FLASK_SERVER + "/drawOnMask", {
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

  // The scroll listener
  const handleScroll = (event) => {
    if (
      props.RP.RadiPOPstates.files.length === 0 ||
      (!event.ctrlKey && !event.altKey)
    ) {
      return;
    }
    if (event.deltaY < 0) {
      if (props.RP.RadiPOPstates.currentSliceIndex - 1 >= 0) {
        props.RP.setRadiPOPstates({
          files: props.RP.RadiPOPstates.files,
          slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
          currentSliceIndex: props.RP.RadiPOPstates.currentSliceIndex - 1,
          patient: props.RP.RadiPOPstates.patient,
        });
      } else {
        return;
      }
    } else {
      if (
        props.RP.RadiPOPstates.currentSliceIndex + 1 <
        props.RP.RadiPOPstates.files.length
      ) {
        props.RP.setRadiPOPstates({
          files: props.RP.RadiPOPstates.files,
          slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
          currentSliceIndex: props.RP.RadiPOPstates.currentSliceIndex + 1,
          patient: props.RP.RadiPOPstates.patient,
        });
      } else {
        return;
      }
    }
  };

  return (
    <div onWheel={handleScroll} className="canvas">
      {props.RP.showSlice && (
        <img
          className="image undraggable"
          src={
            props.RP.RadiPOPstates.slice_mask_container[
              props.RP.RadiPOPstates.currentSliceIndex
            ][0]
          }
          alt="CT slice for editing"
        />
      )}
      {props.RP.showMask &&
        props.RP.RadiPOPstates.slice_mask_container[
          props.RP.RadiPOPstates.currentSliceIndex
        ][1] !== "" && (
          <img
            className="canvasmask undraggable"
            disabled={props.RP.disableApp}
            src={
              props.RP.RadiPOPstates.slice_mask_container[
                props.RP.RadiPOPstates.currentSliceIndex
              ][1]
            }
            onClick={handleClick}
            alt="mask"
          />
        )}
    </div>
  );
}

export default Canvas;
