import React from 'react';
import SearchBar from '../toolbar/Searchbar.js';
import Button from '../toolbar/Button.js';
import Input from '../toolbar/Input.js';
import '../../styles/toolbar.css';
import '../../styles/index.css';




function ToolBar(props) {
  const handleOpen = () => {

  }

    return (
      <div className="row toolbar col-lg-12 col-md-12">
        <div className="brwhite tool-col col-lg-3 col-md-3">
          <Input  label="Open" myClick={handleOpen} />
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
