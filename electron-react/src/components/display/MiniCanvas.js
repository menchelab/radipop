import React from "react";
import "../../styles/display.css";
import "../../styles/index.css";
import preview from "../../assets/images/preview_placeholder.png";

/**
 * Component to show small preview images in the sidebar.
 * @memberof display
 * @method MiniCanvas
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 *  <MiniCanvas index={index} test={props.RP.scrollRefs.current[index]}
 * key={"sidebar_minicanvas" + index} slice_mask_container={smc}
 * RP={props.RP}/>
 */
function MiniCanvas(props) {
  /**
   * @namespace MiniCanvas
   */

  /**
   * Function that sets the current slice index if user clicked on a preview
   * image in the siderbar. The index is passed via props from Sidebar.js.
   *
   * Computes the mask if current slice has no mask.
   * @memberof MiniCanvas
   * @method clickImage
   */
  const clickImage = () => {
    props.RP.setRadiPOPstates({
      files: props.RP.RadiPOPstates.files,
      slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
      currentSliceIndex: parseInt(props.index),
      patient: props.RP.RadiPOPstates.patient,
    });
    //Calculate new mask if current slice has no mask:
    let index = parseInt(props.index);
    if (
      props.RP.RadiPOPstates.slice_mask_container[index][1] === "" &&
      props.RP.showMask
    ) {
      props.RP.setFirstMaskForSlice(index);
    }
  };

  return (
    <div className="slice-mask-container" onClick={clickImage}>
      {props.RP.flaskIntialized && (
        <div className="bottom-right"> {props.index + 1} </div>
      )}
      <img
        src={
          props.RP.RadiPOPstates.files.length
            ? props.slice_mask_container[0]
            : preview
        }
        alt="Slices"
        ref={props.test}
        className={`img${
          props.RP.RadiPOPstates.currentSliceIndex === props.index
            ? "selected"
            : ""
        } undraggable`}
      />
      {props.RP.showMask && props.slice_mask_container[1] !== "" && (
        <img
          className="mask undraggable"
          src={props.slice_mask_container[1]}
          alt="mask"
        />
      )}
      {}
    </div>
  );
}

export default MiniCanvas;
