import React from 'react';
import importImg from '../../assets/images/slice-preview.png';
import '../../styles/display.css';
import '../../styles/index.css';



class Sidebar extends React.Component {
  render() {
    return(
      <div className="scrollbar-area col-lg-3 col-md-3">
            <span>Slice Preview</span>
            <img className="img" src={importImg} alt="Slice preview"/>
      </div>

  );
  }
}

export default Sidebar;
