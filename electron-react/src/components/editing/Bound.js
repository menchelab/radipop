import React from "react";
import ExtendLabel from "../editing/ExtendLabel.js";
import "../../styles/index.css";
import "../../styles/editing.css";

/**
 * Component to set bounds and extend labels on neighbour slices
 * @memberof editing
 * @method Bound
 * @param {*} props RP variable from App.js
 * @param {*} props extendLabelClick callback to editing
 * @param {*} props getBounds callback to editing
 * @returns bound div
 * @example
 * <Bound RP={props.RP} extendLabelClick={extendLabelClick}
 * getBounds={getBounds}/>
 */
function Bound(props) {
  return (
    <div className="tools fill-bottom">
      Expansion bounds:
      <div className="expansion-bounds">
        <div className="expansion-bounds">
          <label htmlFor="Up">Up</label>
          <input
            onChange={props.getBounds}
            type="number"
            defaultValue={0}
            min={0}
            id="Up"
          ></input>
        </div>
        <div className="expansion-bounds">
          <label htmlFor="Down">Down</label>
          <input
            onChange={props.getBounds}
            type="number"
            defaultValue={0}
            min={0}
            id="Down"
          ></input>
        </div>
      </div>
      <ExtendLabel
        label="Extend Label"
        RP={props.RP}
        extendLabelClick={props.extendLabelClick}
      />
    </div>
  );
}

export default Bound;
