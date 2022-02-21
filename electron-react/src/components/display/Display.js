import React from "react";
import MainDisplay from "../display/MainDisplay.js";
import Sidebar from "../display/Sidebar.js";
import "../../styles/display.css";
import "../../styles/index.css";

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
