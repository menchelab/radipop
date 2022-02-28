import React from "react";
import "../../styles/display.css";

/**
 * Creates canvas to edit current selected slice. It is also possible to scroll
 * through the image stack.
 * @memberof display
 * @method Canvas
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 * <Canvas key="Canvas" RP={props.RP}/>
 */

function Canvas(props) {
  /**
   * @namespace Canvas
   */

  /**
   * Function that handles click on Canvas. Checks the boolean prop highlightMode
   * and highlights the mask area, using the highlightOrgan() function.
   *
   * If boolean value is wrong, the user can draw on canvas with the
   * drawOnMask() function.
   * @memberof Canvas
   * @method handleClick
   * @param {*} event Event
   */
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

  /**
   * Flask request to highlight mask area that the user clicked on using the
   * mouse position.
   *
   * Changes the button label for set liver and set spleen label depending on
   * the label of the clicked mask area.
   * @memberof Canvas
   * @method highlightOrgan
   * @param {*} rel_x relative x coordinate with respect to canvas width
   * @param {*} rel_y relative y coordinate with respect to canvas height
   */
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

  /**
   * Flask request that computes the new mask with the drawn line.
   * @memberof Canvas
   * @method drawOnMask
   * @param {*} coordinates
   */
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

  /**
   * Function that sets current slice index depending on scroll direction.
   * @memberof Canvas
   * @method handleScroll
   * @param {*} event Event
   */
  const handleScroll = (event) => {
    // Check if images are loaded and user holds control key
    if (
      props.RP.RadiPOPstates.files.length === 0 ||
      (!event.ctrlKey && !event.altKey)
    ) {
      return;
    }
    // Check scroll direction to set new index
    if (event.deltaY < 0) {
      // Check if new index is valid -> -1 for smooth scroll
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
      // Check if new index is valid -> +1 for smooth scroll
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
