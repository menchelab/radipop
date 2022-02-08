import React, {useState, useEffect, useRef, createRef} from 'react';
import './styles/App.css';
import './styles/index.css';
import ToolBar from './components/toolbar/Toolbar.js';
import Editing from './components/editing/Editing.js';
import Display from './components/display/Display.js';
import slice_place_holder from './assets/images/editor_placeholder.png';

window.RP_vars={};
window.RP_vars.highlightMode=true;
window.RP_vars.selectedPoints= [];
window.RP_vars.LIVER_LABEL=1;
window.RP_vars.SPLEEN_LABEL=2;
window.RP_vars.FLASK_SERVER="http://localhost:4041";
window.RP_vars.low_clip=850;
window.RP_vars.high_clip=1250;


function App() {
  // States for loaded Files: files-> .png + .p unordered, masks-> .p ordered, slices-> .png ordered
  const [RadiPOPstates, setRadiPOPstates] = useState({
    files: [],
    slice_mask_container: [[slice_place_holder,""]],
    currentSliceIndex: 0,
    patient: "None",
    showMask: false,
    status: ["Log: Here you will find important information about the App status and possible errors"],
    });

  const [newMask, setNewMask] = useState("")
  window.RP_vars.newMask=newMask
  window.RP_vars.setNewMask=p=>{setNewMask(p)}
  const [flaskIntialized, setflaskIntialized] = useState(false)
  window.RP_vars.flaskIntialized=flaskIntialized
  window.RP_vars.setflaskIntialized=p=>{setflaskIntialized(p)}

  // React ref to store array of refs
  const scrollRefs = useRef([]);

  useEffect(() => {
    let update = RadiPOPstates.slice_mask_container;
    update[RadiPOPstates.currentSliceIndex][1] = newMask;
    setRadiPOPstates({files: RadiPOPstates.files,
                            slice_mask_container: update,
                            currentSliceIndex:RadiPOPstates.currentSliceIndex,
                            patient: RadiPOPstates.patient,
                            showMask: RadiPOPstates.files.length>0,
                            status: RadiPOPstates.status});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMask]);

  return(
    // Passing state to Toolbar and Display
    <div>
      <ToolBar key="Toolbar" RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}} scrollRefs={scrollRefs}/>
      <div className="row">
        <Editing key="Editing" RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}}/>
        {RadiPOPstates && <Display RadiPOPstates={RadiPOPstates} setRadiPOPstates={p=>{setRadiPOPstates(p)}} scrollRefs={scrollRefs}/>}
      </div>
    </div>
 );
}

export default App;
