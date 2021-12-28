import React, {useState} from 'react';
import MiniCanvas from '../display/MiniCanvas.js';

import '../../styles/display.css';
import '../../styles/index.css';



function Sidebar(props){
  const [highlightIndex, setHighlightIndex] = useState(0);
  const clickImage = (event) => {
    let clicked = event.currentTarget;
    clicked.style.border = "2px solid blue";
    props.setEditingImage(clicked.src);

  }

    return(
      <div className="scrollbar-area col-lg-3 col-md-3">
            <span style={{textAlign: "center"}}>Slice Preview</span>
      {props.sidebarFile.map(p => {
        return <MiniCanvas
              highlightIndex={highlightIndex}
              setHighlightIndex={setHighlightIndex}
              setEditingImage={props.setEditingImage}
              key={p}
              clickImage={clickImage}
              p={p}/>
      })}
      </div>
  );
}

export default Sidebar;
