import React from "react";
import MainDisplay from "../display/MainDisplay.js";
import Sidebar from "../display/Sidebar.js";
import "../../styles/display.css";
import "../../styles/index.css";

/**
 * @namespace display
 */

 /**
  * Creates Display component. Parent for MainDisplay.js and Sidebar.js.
  * @memberof App
  * @method Display
  * @param {*} props RP variable from App.js
  * @returns Display div
  * @example
  * {RP.RadiPOPstates && <Display RP={RP} />}
  */
function Display(props) {
  return (
    // Passing props to MainDisplay and Sidebar to display state info of App.js
    <div>
      <MainDisplay key="MainDisplay" RP={props.RP} />
      <Sidebar key="SideBar" RP={props.RP} />
    </div>
  );
}

export default Display;
