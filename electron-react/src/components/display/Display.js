import React from 'react';
import MainDisplay from '../display/MainDisplay.js';
import Sidebar from '../display/Sidebar.js'
import '../../styles/display.css';
import '../../styles/index.css';



class Display extends React.Component {
  render() {
    return(
      <div>
        <MainDisplay/>
        <Sidebar/>
      </div>
    );
  }
}

export default Display;
