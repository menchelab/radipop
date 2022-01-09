import React, {useState} from 'react';
import './styles/App.css';
import './styles/index.css';
import ToolBar from './components/toolbar/Toolbar.js';
import Editing from './components/editing/Editing.js';
import Display from './components/display/Display.js';
import slice_place_holder from './assets/images/editor_placeholder.png';


function App() {
  // States for loaded Files: files-> .png + .p unordered, masks-> .p ordered, slices-> .png ordered
  const [RadiPOPstates, setRadiPOPstates] = useState({
    files: [],
    slice_mask_container: [[slice_place_holder,""]],
    currentSliceIndex: 0,
    patient: "None",
    showMask: '',
    });


  return(
    // Passing state to Toolbar and Display
    <div>
      <ToolBar RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}}/>
      <div className="row">
        <Editing RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}}/>
        {RadiPOPstates && <Display RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}} />}
      </div>
    </div>
 );
}

export default App;
