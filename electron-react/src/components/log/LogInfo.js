import React from "react";
import "../../styles/log.css";

/**
 * @namespace log
 */

/**
 * Creates list elements to display the current app status using
 * the logInfo state variable.
 *
 * The message is defined in the LogMessage.js component.
 *
 * @memberof log
 * @method Log
 * @param {*} props RP variable from App.js
 * @returns div
 * @example
 *   <Log key="Log" RP={props.RP} />
 */
function Log(props) {
  const status = props.RP.logInfo;
  const listItems = status
    .map((status, i) => <li key={"LogInfo" + String(i)}> {status}</li>)
    .reverse();
  return (
    <div key="LogInfo" className="log">
      <ul> {listItems} </ul>
    </div>
  );
}

export default Log;
