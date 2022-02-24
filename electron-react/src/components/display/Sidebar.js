import React, { createRef } from "react";
import MiniCanvas from "../display/MiniCanvas.js";
import "../../styles/display.css";
import "../../styles/index.css";

/**
 * Sidebar component for the preview area. Parent component of MiniCanvas.js.
 * @memberof display
 * @method Sidebar
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 * <Sidebar key="SideBar" RP={props.RP} />
 */
function Sidebar(props) {
  props.RP.scrollRefs.current = [
    ...Array(props.RP.RadiPOPstates.files.length).keys(),
  ].map((_, i) => props.RP.scrollRefs.current[i] ?? createRef());

  return (
    <div className="heading col-lg-2 col-md-2">
      <span style={{ textAlign: "center" }}>Slice Preview</span>
      <div className="scrollbar-area col-lg-12 col-md-12">
        {props.RP.RadiPOPstates.slice_mask_container.map((smc, index) => {
          return (
            <MiniCanvas
              index={index}
              test={props.RP.scrollRefs.current[index]}
              key={"sidebar_minicanvas" + index}
              slice_mask_container={smc}
              RP={props.RP}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
