import React from 'react';
import SearchBar from '../toolbar/Searchbar.js';
import Button from '../toolbar/Button.js';
import Input from '../toolbar/Input.js';
import '../../styles/toolbar.css';
import '../../styles/index.css';

function ToolBar(props) {
  // Handler for Input Open Button -> load files
  const changeHandler = (event) => {
    let mask_files=[] // array to store .p files
    let slice_files=[] // array to store .png slices
    let slice_url=[] // array for slice URL -> display
    // Set State: all loaded files unordered
  	props.setSelectedFile({files: event.target.files});
    // Split .p and .png files
    for (let i=0; i<event.target.files.length; i++) {
      if (event.target.files[i].name.endsWith(".png")) {
        slice_files.push(event.target.files[i]);
      }
      if (event.target.files[i].name.endsWith(".p")) {
        mask_files.push(event.target.files[i]);
      }
   }
    // Order slices and masks
    slice_files=[].slice.call(slice_files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    mask_files=[].slice.call(mask_files).sort((a, b) => (parseInt(a.name.replace(".p","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    // Get Object URL to display slices
    for(let i=0; i<slice_files.length; i++){
      slice_url.push(URL.createObjectURL(slice_files[i]))
    }
    // Update state with loaded files
    props.setSelectedFile({slices: slice_url, masks: mask_files});
    // Update main display slice with first ct slice
    props.setEditingImage(slice_url[0]);
  }
    return (
      <div className="row toolbar col-lg-12 col-md-12">
        <div className="brwhite tool-col col-lg-3 col-md-3">
          <Input  label="Open" myChange={changeHandler} />
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
