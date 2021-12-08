import React from 'react';
import '../../styles/index.css';
import '../../styles/editing.css';

function Bound(){
  return(
    <div className="tools">
      <div className="expansion-bounds">
        Expansion bounds:
        <div>
          Left: <input type="number" /> Right: <input type="number"/>
        </div>
      </div>
    </div>
  );
}

export default Bound;
