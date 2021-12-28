import React from 'react';
import '../../styles/display.css'
function Canvas(props){

  return(
     <img className="img" src={props.editingImage} alt="CT slice for editing"/>
  );
}

export default Canvas;
