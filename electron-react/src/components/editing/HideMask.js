import React from 'react';
import '../../styles/editing.css';

function HideMask(props) {
    return (
      <div className="toolsh">
        <input type="checkbox" id="hide-mask-checkbox" name="hide-mask-checkbox" />
        <label style={{paddingLeft: "5px"}} htmlFor="hide-mask-checkbox">Hide mask</label>
      </div>
    );
  };

export default HideMask;
