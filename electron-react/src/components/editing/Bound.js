import React from 'react';
import ExtendLabel from '../editing/ExtendLabel.js';
import '../../styles/index.css';
import '../../styles/editing.css';

function Bound(props){
  return(
    <div className="tools fill-bottom">
      Expansion bounds:
      <div className="expansion-bounds">
          <div className="expansion-bounds">
            <label htmlFor="Up">Up</label>
            <input onChange={props.getBounds} type="number" id="Up"></input>
          </div>
          <div className="expansion-bounds">
            <label htmlFor="Down">Down</label>
            <input onChange={props.getBounds} type="number" id="Down"></input>
          </div>
        </div>
            <ExtendLabel label='Extend Label' RP={props.RP} extendLabelClick={props.extendLabelClick}/>
        </div>
  );
}

export default Bound;
