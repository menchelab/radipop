import React from 'react';
import importImg from '../../assets/images/editor_placeholder.png';
import '../../styles/display.css'
function Canvas(props){
  return(
      <img className="img" src={importImg} alt="CT slice for editing"/>

  );
}

export default Canvas;
