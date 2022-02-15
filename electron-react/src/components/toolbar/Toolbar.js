import React, {useState,useEffect} from 'react';
import SearchBar from '../toolbar/Searchbar.js';
import Button from '../toolbar/Button.js';
import Input from '../toolbar/Input.js';
import DialogModal from '../toolbar/DialogModal.js';
import LogMessage from '../log/LogMessage.js';
import '../../styles/toolbar.css';
import '../../styles/index.css';




function ToolBar(props) {
  const initialize =(paths,smc, mask_files, patientID) => {
    let data={
      paths: paths,
      "patientID": patientID
    };
    fetch(props.RP.FLASK_SERVER+"/initialize", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();  })
    .then(function(data){
      console.log(data["message"]);
      let mask_files_paths  = mask_files.map((item) => item.path);
      for(let i=0; i<mask_files_paths.length; i++){
        postPickleGetMask(smc,i, mask_files_paths[i], patientID);
      }
      props.RP.setflaskIntialized(true);
    })
    .catch(error_handler)
  }
  //Function is raised when requests to Flask server fail for any reason
  function error_handler(){
    const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message="Failed to contact flask server or Flask handling error"/>);
    props.RP.setlogInfo(logInfo);
    props.RP.setDisableApp(false);

    //alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
  }

  // Post the path to a mask pickle file and get a transparent PNG file in return
  const postPickleGetMask = (smc, index, path, patientID) => {
    let data = {
      index: index,
      path: path,
      "patientID": patientID};
    fetch(props.RP.FLASK_SERVER+"/postPickleGetMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();  })
    .then(function(data){
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      smc[index][1]= img;
      numberOfConvertedMasksHelper= numberOfConvertedMasksHelper+1; 
      setnumberOfConvertedMasks(numberOfConvertedMasksHelper);
    }).catch(error_handler)
  }

  // Handler for Input Open Button -> load files
  const openHandler = (event) => {
    console.log("open handler")
    let target_files= []
    // Filter out only .png or .p files that start with a number (0-99999...)
    for (let i=0; i<event.target.files.length; i++) {
      if (event.target.files[i].name.match(/^(0|[1-9][0-9]*)\.(png|p)$/g)){
          target_files.push(event.target.files[i])
      }
    }

    // Check if user selected new files -> return if user clicked "cancel"
    if(target_files.length > 0){
      initializeWithFiles(target_files);
    }
    else {
      const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message="No slice files (.png) were found."/>);
      props.RP.setlogInfo(logInfo);
    }
    //In order to be able to call dcm2png again on same dir --> event must change
    event.target.value="";
  }
  const initializeWithFiles =(files) =>{
    let mask_files=[] // array to store .p files
    let slice_files=[] // array to store .png slices
    // Set State: all loaded files unordered

    // Split .p and .png files
    for (let i=0; i<files.length; i++) {
      if (files[i].name.endsWith(".png")) {
        slice_files.push(files[i]);
      }
      if (files[i].name.endsWith(".p")) {
        mask_files.push(files[i]);
      }
   }

   if(slice_files.length === 0){
    const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message="No slice files (.png) were found."/>);
    props.RP.setlogInfo(logInfo);
    return
   }

    // Get selected directory/patient name
    let directory_name = files[0].webkitRelativePath
    directory_name = directory_name.substr(0, directory_name.indexOf('/'));

    props.RP.setRadiPOPstates({files: files});

    // Order slices and masks
    slice_files=[].slice.call(slice_files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    mask_files=[].slice.call(mask_files).sort((a, b) => (parseInt(a.name.replace(".p","")) > parseInt(b.name.replace(".p",""))) ? 1 : -1 )

    let smc=[]
    // Get Object URL to display slices
    for(let i=0; i<slice_files.length; i++){
      smc.push([URL.createObjectURL(slice_files[i]),""])
    }
    let slice_files_paths  = slice_files.map((item) => item.path);
    initialize(slice_files_paths, smc, mask_files, directory_name);



    // Update state with loaded files
    const logInfo = props.RP.logInfo.concat(<LogMessage type="success" message="You succesfully loaded the .png files in EditorXR!"/>);
    props.RP.setlogInfo(logInfo);
    props.RP.setRadiPOPstates({files: slice_files, slice_mask_container: smc, currentSliceIndex:0, patient: directory_name});

  }
  /*
  useEffect(() => {
  props.RP.setRadiPOPstates({files: props.RP.RadiPOPstates.files, slice_mask_container: props.RP.RadiPOPstates.slice_mask_container, currentSliceIndex:0, patient:"?", showMask:true});
  },[]); */

  //Show masks after all pickle files were converted
  let numberOfConvertedMasksHelper=0; 
  const [numberOfConvertedMasks, setnumberOfConvertedMasks] = useState(0);
  useEffect(() => {
    if (props.RP.flaskIntialized && numberOfConvertedMasks===props.RP.RadiPOPstates.files.length){
      props.RP.setshowMask(true)
      const logInfo = props.RP.logInfo.concat(<LogMessage type="success" message={"Loaded all mask files"} />);
      props.RP.setlogInfo(logInfo);
    }
    if (numberOfConvertedMasks>0 && numberOfConvertedMasks< props.RP.RadiPOPstates.files.length && numberOfConvertedMasks%50===0) {
      const logInfo = props.RP.logInfo.concat(<LogMessage type="warning"  message={"Loaded " + String(numberOfConvertedMasks) +" of " + String(props.RP.RadiPOPstates.files.length) + " mask files"} />);
      props.RP.setlogInfo(logInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[numberOfConvertedMasks]);
  const [CorrectParitionButtonLabel, setCorrectParitionButtonLabel] = useState("Correct Partition");
  const [state, setState] = useState({
          low_clip: props.RP.low_clip,
          high_clip: props.RP.high_clip,
          showDialog: false,
          files: [],
      });

  const resetMask = () => {
    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "index": props.RP.RadiPOPstates.currentSliceIndex
    };
    fetch(props.RP.FLASK_SERVER+"/getMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      props.RP.setNewMask(img);
      console.log("reset")
    }).catch(error_handler)
  }

  const correctPartition = () => {
    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "coordinates": props.RP.selectedPoints,
      "index": props.RP.RadiPOPstates.currentSliceIndex
    };
    fetch(props.RP.FLASK_SERVER+"/correctPartition", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      props.RP.setNewMask(img);
      const logInfo = props.RP.logInfo.concat(<LogMessage type="success" message={"Corrections for mask of slice " + String(props.RP.RadiPOPstates.currentSliceIndex+1) +" were accepted"}/>);
      props.RP.setlogInfo(logInfo);
    }).catch(error_handler)
  }

  const handleCorrectPartition = (event) => {
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    const highlight= !props.RP.highlightMode;
    props.RP.sethighlightMode(highlight);
    console.log(highlight);
    if (highlight){
      setCorrectParitionButtonLabel("Correct Partition")
      props.RP.setselectedPoints([]);
      resetMask();
    }
    else {
      setCorrectParitionButtonLabel("Exit correction mode");
    }
  }
  const handleCommitCorrections = (event) => {
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    if (props.RP.selectedPoints.length>2){
      console.log("Commited changes")
      correctPartition();
      setCorrectParitionButtonLabel("Correct Partition");
      props.RP.sethighlightMode(true);
      props.RP.setselectedPoints([]);
    }
  }

  const handleClearEdits = (event) =>{
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    props.RP.setselectedPoints([]);
    resetMask();
  }

  const dcm2pngDialog = (event) => {

    console.log("dcm2png button was clicked")
    let files= event.target.files;
    let dcm_files=[];
    for (let i=0; i<files.length; i++) {
      //dcm filename must not start with . or _ --> issue especially on windows
      if (files[i].name.match(/^(?!(\.|_)).*\.dcm/g)) {
        dcm_files.push(files[i].path);
      }
    }
    if(dcm_files.length === 0){
      const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message="No .dcm files were found in the selected directory."/>);
      props.RP.setlogInfo(logInfo);
      return
    }
    props.RP.setDisableApp(true);
    setState({ showDialog: !state.showDialog, low_clip: state.low_clip, high_clip: state.high_clip, files: dcm_files});
    //In order to be able to call dcm2png again on same dir --> event must change
    event.target.value="";
  }

  const handleDicomClips = () => {
    dcm2png(state.files);
    setpreview(""); 
  }

  const saveHandler = (event) => {
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    //Deciding whether output path is in unix or windows style --> delimiter
    let delimiter = (props.RP.RadiPOPstates.files[0].path.charAt(0)==="/")?"/":"\\";
    let outpath=props.RP.RadiPOPstates.files[0].path.substring(0, props.RP.RadiPOPstates.files[0].path.lastIndexOf(delimiter)+1);

    let data={
      "patientID": props.RP.RadiPOPstates.patient,
      "path": outpath
    };
    fetch(props.RP.FLASK_SERVER+"/saveMasks", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let logInfo = props.RP.logInfo.concat(<LogMessage type="success" message={data["message"]}/>);
      props.RP.setlogInfo(logInfo);

    }).catch(error_handler)
  }

  const dcm2png = (dcm_files) => {
    // Check if user selected new files -> return if user clicked "cancel"
    let logInfo = props.RP.logInfo.concat(<LogMessage type="warning" message={"Converting " + String(dcm_files.length) + " .dcm files to png..."}/>);
    props.RP.setlogInfo(logInfo);

    let data={
      low_clip: +state.low_clip,
      high_clip: +state.high_clip,
      "paths": dcm_files
    };
    console.log("dcm2png");
    fetch(props.RP.FLASK_SERVER+"/dcm2png", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      console.log(data["message"]);
      console.log(data["metadata"]);
      logInfo = logInfo.concat(<LogMessage type="success" message={data["message"]}/>);
      props.RP.setlogInfo(logInfo);
      props.RP.setDisableApp(false);
      /*initializeWithFiles(png_files); */
    }).catch(error_handler)
  }


  function _onChange(e) {
    e.preventDefault();
    if(e.target.id === 'low_clip'){
      setState({ showDialog: state.showDialog, low_clip: e.target.value, high_clip: state.high_clip, files: state.files});
    }
    else if(e.target.id === 'high_clip') {
      setState({ showDialog: state.showDialog, low_clip: state.low_clip, high_clip: e.target.value, files: state.files});
    }
 }

function _onSubmit(e) {
    e.preventDefault();
    setState({showDialog: false, low_clip: state.low_clip, high_clip: state.high_clip, files: state.files});
}
const [preview, setpreview] = useState("");
function handlePreview(){
  let data={
    low_clip: + state.low_clip,
    high_clip: + state.high_clip,
    "path": state.files[0]
  };
  console.log("dcm2pngPreview");
  fetch(props.RP.FLASK_SERVER+"/dcm2pngPreview", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(response){ return response.json();})
  .then(function(data) {
    console.log(data["message"]);
    console.log(data["metadata"]);
    let bytestring = data["slice"];
    let img = bytestring.split('\'')[1];
    img= "data:image/png;base64," +img;
    setpreview(img);
    //props.RP.setDisableApp(false);
    setState({ showDialog: true, low_clip: state.low_clip, high_clip: state.high_clip, files: state.files});
  }).catch(error_handler)
}
return (
  <div className="row toolbar col-lg-12 col-md-12">
    <div className="brwhite tool-col col-lg-3 col-md-3">
      <Input RP={props.RP} key="OpenButton" label="Open" myChange={openHandler} />
      <Input  RP={props.RP} key="dcm2png" label="dcm2png" myChange={dcm2pngDialog} />
      <Button RP={props.RP} key="SaveButton" label="Save" myClick={saveHandler}/>
    </div>
    <div className="tool-col col-lg-7 col-md-7">
      <Button RP={props.RP} key="CorrectPartitionButton" label={CorrectParitionButtonLabel} myClick={handleCorrectPartition} />
      <Button RP={props.RP} key="CommitCorrectionsButton" label="Commit corrections" myClick={handleCommitCorrections} />
      <Button RP={props.RP} key="ClearEditsButton" label="Clear edits" myClick={handleClearEdits}/>
    </div>
    <div className="blwhite tool-col col-lg-2 col-md-2">
      <SearchBar RP={props.RP} scrollRefs={props.RP.scrollRefs}/>
    </div>
    {/* Show Modal - Renders Outside React Hierarchy Tree via Portal Pattern */}
    {state.showDialog === true ? (
        <DialogModal>
            <div className="dialog-wrapper">
                <h3>Set clipping values for dicom conversion</h3>
                <form onSubmit={_onSubmit}>
                    {preview!=="" && <div className="previewDiv"> <img className="previewSlice" src={preview} alt="Preview" /> </div>}
                    <div className="previewDiv2">
                    LOW: <input type="text" id="low_clip" value={state.low_clip} onChange={_onChange} /> {" "}
                    HIGH: <input type="text" id="high_clip" value={state.high_clip} onChange={_onChange} />{" "}
                    </div>
                    <div className="previewDiv2">
                    <button onClick={handlePreview}> Preview </button>
                    <button onClick={handleDicomClips} type="submit">Set</button>
                    </div>
                    
                </form>
            </div>
        </DialogModal>
    ) : null}
  </div>
  );
 }

export default ToolBar;
