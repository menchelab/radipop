import React from "react";
import "../../styles/log.css";
import warning_svg from "../..//assets/images/Warning.svg";
import error_svg from "../../assets/images/Error.svg";
import success_svg from "../../assets/images/Success.svg";

/**
 * Creates a log message with a image symbol (warning, error or success).
 *
 * @memberof log
 * @method LogMessage
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 * <LogMessage type="warning" message={"Setting threshold for " +
 * String(props.RP.RadiPOPstates.files.length) + " slices..."}/>
 */
function LogMessage(props) {
  const symbol =
    props.type === "warning"
      ? warning_svg
      : props.type === "error"
      ? error_svg
      : success_svg;
  return (
    <div className="LogMessage">
      <img src={symbol} alt="LogMessage" /> {" " + props.message}{" "}
    </div>
  );
}

export default LogMessage;
