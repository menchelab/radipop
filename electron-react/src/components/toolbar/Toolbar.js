import React, {useState} from 'react';
import SearchBar from '../toolbar/Searchbar.js';
import Button from '../toolbar/Button.js';
import Input from '../toolbar/Input.js';
import '../../styles/toolbar.css';
import '../../styles/index.css';

function initialize(paths,patientID) {
  let data={
    paths: paths,
    "patientID": patientID
  };
  fetch(window.RP_vars.FLASK_SERVER+"/initialize", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(response){ return response.json();  })
  .then(function(data){ 
    console.log(data["message"]); 
    window.RP_vars.setflaskIntialized(true); 
  })
  .catch(error_handler)
}
//Function is raised when requests to Flask server fail for any reason
function error_handler(){
  console.log("Failed to contact flask server or Flask handling error");
  //alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
}

// Post the path to a mask pickle file and get a transparent PNG file in return
function postPickleGetMask (smc, index, path, patientID)  {
  let data = {
    index: index, 
    path: path,
    "patientID": patientID};
  fetch(window.RP_vars.FLASK_SERVER+"/postPickleGetMask", {
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
  }).catch(error_handler)
}


function ToolBar(props) {
  // Handler for Input Open Button -> load files
  const openHandler = (event) => {
    let files = event.target.files; 

    // Check if directory only contains .png and .p files and a .DS_Store file
    for (let i=0; i<files.length; i++) {
      if ((!files[i].path.endsWith(".png")) && (!files[i].path.endsWith(".p"))
      && (!files[i].path.endsWith(".dcm")) && (!files[i].path.endsWith(".DS_Store"))){
          alert("Directory should only contain .png and .p files")
          return
      }
        }
    initializeWithFiles(files);
  }
  const initializeWithFiles =(files) =>{
    let mask_files=[] // array to store .p files
    let slice_files=[] // array to store .png slices
    // Set State: all loaded files unordered


    // Check if user selected new files -> return if user clicked "cancel"
    if(files.length === 0){
      return
    }
    // Get selected directory/patient name
    let directory_name = files[0].webkitRelativePath
    directory_name = directory_name.substr(0, directory_name.indexOf('/'));

    props.setRadiPOPstates({files: files});
    // Split .p and .png files
    for (let i=0; i<files.length; i++) {
      if (files[i].name.endsWith(".png")) {
        slice_files.push(files[i]);
      }
      if (files[i].name.endsWith(".p")) {
        mask_files.push(files[i]);
      }
   }
    // Order slices and masks
    slice_files=[].slice.call(slice_files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    mask_files=[].slice.call(mask_files).sort((a, b) => (parseInt(a.name.replace(".p","")) > parseInt(b.name.replace(".p",""))) ? 1 : -1 )

    let smc=[]
    // Get Object URL to display slices
    for(let i=0; i<slice_files.length; i++){
      smc.push([URL.createObjectURL(slice_files[i]),""])
    }
    let slice_files_paths  = slice_files.map((item) => item.path);
    initialize(slice_files_paths, directory_name);


    let mask_files_paths  = mask_files.map((item) => item.path);
    for(let i=0; i<mask_files_paths.length; i++){
      postPickleGetMask(smc,i, mask_files_paths[i], directory_name);
    }

    // Update state with loaded files
    const loginfo = props.RadiPOPstates.status.concat("You succesfully loaded the .png files in EditorXR!");
    props.setRadiPOPstates({files: slice_files, slice_mask_container: smc, currentSliceIndex:0, patient: directory_name, showMask:false, status: loginfo});

  }
  /*
  useEffect(() => {
  props.setRadiPOPstates({files: props.RadiPOPstates.files, slice_mask_container: props.RadiPOPstates.slice_mask_container, currentSliceIndex:0, patient:"?", showMask:true, status: props.RadiPOPstates.status});
  },[]); */

  const [CorrectParitionButtonLabel, setCorrectParitionButtonLabel] = useState("Correct Partition");

  const resetMask = () => {
    let data={
      "patientID": props.RadiPOPstates.patient,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch(window.RP_vars.FLASK_SERVER+"/getMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      window.RP_vars.setNewMask(img);
      console.log("reset")
    })
  }

  const correctPartition = () => {
    let data={
      "patientID": props.RadiPOPstates.patient,
      "coordinates": window.RP_vars.selectedPoints,
      "index": props.RadiPOPstates.currentSliceIndex
    };
    fetch(window.RP_vars.FLASK_SERVER+"/correctPartition", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      window.RP_vars.setNewMask(img);
    })
  }

  const handleCorrectPartition = (event) => {
    window.RP_vars.highlightMode= !window.RP_vars.highlightMode; 
    if (window.RP_vars.highlightMode){
      setCorrectParitionButtonLabel("Correct Partition")
      window.RP_vars.selectedPoints=[];
      resetMask(); 
    }
    else {
      setCorrectParitionButtonLabel("Exit correction mode");
    }
  }
  const handleCommitCorrections = (event) => {
    if (window.RP_vars.selectedPoints.length>2){
      console.log("Commited changes")
      correctPartition();
      setCorrectParitionButtonLabel("Correct Partition");
      window.RP_vars.highlightMode=true; 
      window.RP_vars.selectedPoints=[];
    }
  }

  const handleClearEdits = (event) =>{
    window.RP_vars.selectedPoints=[];
    resetMask(); 
  }


  const saveHandler = (event) => {
    console.log("Save files")
    let outpath=props.RadiPOPstates.files[0].path.substring(0, props.RadiPOPstates.files[0].path.lastIndexOf("/")+1);
    console.log(outpath);

    let data={
      "patientID": props.RadiPOPstates.patient,
      "path": outpath
    };
    fetch(window.RP_vars.FLASK_SERVER+"/saveMasks", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      console.log(data)
    })
  }

  const dcm2png = (event) => {
    // Check if user selected new files -> return if user clicked "cancel"
    let files= event.target.files;
    if(files.length === 0){
      return
    }
    let dcm_files=[];
    let png_files=[];
    let path = files[0].path.substring(0, files[0].path.lastIndexOf("/")+1);
    for (let i=0; i<files.length; i++) {
      if (files[i].name.endsWith(".dcm")) {
        dcm_files.push(files[i].path);
        png_files.push(path+String(i)+".png");
      }
    }
    console.log(png_files);
    let data={
      low_clip: window.RP_vars.low_clip, 
      high_clip: window.RP_vars.high_clip,
      "paths": dcm_files
    };
    fetch(window.RP_vars.FLASK_SERVER+"/dcm2png", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})
    .then(function(data) {
      console.log(data["message"]);
      console.log(data["metadata"]);
      /*initializeWithFiles(png_files); */
    })
  }

return (
  <div className="row toolbar col-lg-12 col-md-12">
    <div className="brwhite tool-col col-lg-3 col-md-3">
      <Input  key="OpenButton" label="Open" myChange={openHandler} />
      <Input  key="dcm2png" label="dcm2png" myChange={dcm2png} />
      <Button key="SaveButton" label="Save" myClick={saveHandler}/>
    </div>
    <div className="tool-col col-lg-7 col-md-7">
      <Button key="CorrectPartitionButton" label={CorrectParitionButtonLabel} myClick={handleCorrectPartition} />
      <Button key="CommitCorrectionsButton" label="Commit corrections" myClick={handleCommitCorrections} />
      <Button key="ClearEditsButton" label="Clear edits" myClick={handleClearEdits}/>
    </div>
    <div className="blwhite tool-col col-lg-2 col-md-2">
      <SearchBar RadiPOPstates={props.RadiPOPstates}/>
    </div>
  </div>
  );
 }

export default ToolBar;
