import React from 'react';
import '../../styles/display.css';
import '../../styles/index.css';




function MiniCanvas(props) {
  const clickImage = (event) => {
    props.setEditingImage(event.currentTarget.src);
    props.setHighlightIndex(event.currentTarget.src);
  }
    return(
       <img 
       src={props.p}
       alt="Slices"
       className={`img${props.highlightIndex === props.p ? 'selected' : ''}`}
       onClick={clickImage}/>
  );
}

export default MiniCanvas;
