import React from 'react';
import SearchBar from '../toolbar/Searchbar.js';
import Button from '../toolbar/Button.js';
import '../../styles/toolbar.css';
import '../../styles/index.css';




function ToolBar(props) {
    return (
      <div className="row toolbar col-lg-12 col-md-12">
        <div className="brwhite tool-col col-lg-3 col-md-3">
          <Button label="Open" color="rgb(0,113,227)" borderColor="2px solid rgb(0,113,227)"/>
          <Button label="Save"/>
        </div>
        <div className="tool-col col-lg-6 col-md-6">
          <Button label="Correct partition"/>
          <Button label="Clear edits"/>
        </div>
        <div className="blwhite tool-col col-lg-3 col-md-3">
          <SearchBar/>
        </div>
      </div>
    );
 }

export default ToolBar;
