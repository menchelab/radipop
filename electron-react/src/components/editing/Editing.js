import React, {useState, useEffect, useRef} from 'react';
import HideMask from '../editing/HideMask.js';
import Slider from '../editing/Slider.js'
import GlobalThreshold from '../editing/GlobalThreshold.js';
import Bound from '../editing/Bound.js';
import SetLabel from '../editing/SetLabel.js';
import LogMessage from '../log/LogMessage.js';
import '../../styles/editing.css';
import '../../styles/index.css';




function Editing(props) {
    const [sliderValue, setSliderValue] = useState({
      bone: '255',
      vessel: '180',
      liver: '100',
    });

    const[expansionBounds, setExpansionBounds]=useState({
      up: 0,
      down: 0
    });

    const [newMask, setNewMask] = useState({mask:'', index:props.RadiPOPstates.currentSliceIndex});
    const [checkGlobalUpdate, setGlobalUpdate] = useState(false) //State to check if all Thresholds are set
    const [disableApp, setDisableApp] = useState(false) //State to disable App functions during computations

    // Update state "value" on slider change
    const handleSlide = (event) => {
      if(event.target.id === 'bone'){
        setSliderValue({bone: parseInt(event.target.value,10) , vessel: sliderValue.vessel, liver: sliderValue.liver});
      }
      if(event.target.id === 'vessel'){
        setSliderValue({bone: sliderValue.bone , vessel: parseInt(event.target.value,10), liver: sliderValue.liver});
      }
      if(event.target.id === 'liver'){
        setSliderValue({bone: sliderValue.bone , vessel: sliderValue.vessel, liver: parseInt(event.target.value,10)});
      }
    }

    const handleClickPlus = (event) => {
      if(event.target.id === 'bone' && sliderValue.bone < 300){
        setSliderValue({bone: parseInt(sliderValue.bone, 10) + 1 , vessel: sliderValue.vessel, liver: sliderValue.liver});
      }
      if(event.target.id === 'vessel' && sliderValue.vessel < 300){
        setSliderValue({bone: sliderValue.bone , vessel: parseInt(sliderValue.vessel, 10) + 1, liver: sliderValue.liver});
      }
      if(event.target.id === 'liver' && sliderValue.liver < 300){
        setSliderValue({bone: sliderValue.bone , vessel: sliderValue.vessel, liver: parseInt(sliderValue.liver, 10) + 1});
      }
    }

    const handleClickMinus = (event) => {
      if(event.target.id === 'bone' && sliderValue.bone > 0){
        setSliderValue({bone: parseInt(sliderValue.bone, 10) - 1 , vessel: sliderValue.vessel, liver: sliderValue.liver});
      }
      if(event.target.id === 'vessel' && sliderValue.vessel > 0){
        setSliderValue({bone: sliderValue.bone , vessel: parseInt(sliderValue.vessel, 10) -1, liver: sliderValue.liver});
      }
      if(event.target.id === 'liver' && sliderValue.liver > 0){
        setSliderValue({bone: sliderValue.bone , vessel: sliderValue.vessel, liver: parseInt(sliderValue.liver, 10) - 1});
      }
    }

    // Set the Threshold globally
    function setThesholdGlobally(){
      console.log("Triggered setThresholdGlobally")
      if(disableApp===true){
        alert("EditorXR computes the new masks. Please wait for the notification in the Log");
        return
      }
      // Check if user loaded files if not -> return
      if(props.RadiPOPstates.files.length === 0){
        return
      }
      setDisableApp(true); //Disable buttons/sliders during computation
      for (let i=0; i<props.RadiPOPstates.slice_mask_container.length; i++) {
        let current_slice = String(i);
        updateMask(current_slice, sliderValue, true);
      }
    }

    const getBounds = (event) => {
      if(event.target.id === 'Up'){
        setExpansionBounds({up: event.target.value, down: expansionBounds.down})
      }
      if(event.target.id === 'Down'){
        setExpansionBounds({up: expansionBounds.up, down: event.target.value})
      }
    }

    function extendLabelClick(){
      extendLabels(expansionBounds.up, expansionBounds.down)
    }

    // Update the mask. Function should be called when the intensity sliders change.
    // RadiPOP segmenter will calculate a new mask --> update mask in main window
    const updateMask = (target_slice_idx, value, global) => {

      let data={
        "patientID": props.RadiPOPstates.patient,
        "bone-intensity-slider": value.bone,
        "liver-intensity-slider": value.liver,
        "blood-vessel-intensity-slider": value.vessel,
        "index": target_slice_idx
      };
      fetch(window.RP_vars.FLASK_SERVER+"/updateMask", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(response){ return response.json();})
      .then(function(data) {
        let bytestring = data["mask"];
        let img = bytestring.split('\'')[1];
        img= "data:image/png;base64," +img;
        setNewMask({mask: img, index: target_slice_idx});
        if (global === true && +target_slice_idx === props.RadiPOPstates.slice_mask_container.length-1){
           setGlobalUpdate(!checkGlobalUpdate);
        }
      }).catch(error_handler)
    }

    //Function is raised when requests to Flask server fail for any reason
    const error_handler = () => {
      console.log("Failed to contact flask server or Flask handling error");
      //alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
    }

    // Updates Mask on slider change
    useEffect(() => {
      if (window.RP_vars.flaskIntialized){
        updateMask(props.RadiPOPstates.currentSliceIndex, sliderValue, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[sliderValue]);

    // Render new mask after computation
    useEffect(() => {
      let update = props.RadiPOPstates.slice_mask_container;
      update[newMask.index][1] = newMask.mask;
      props.setRadiPOPstates({files: props.RadiPOPstates.files,
                              slice_mask_container: update,
                              currentSliceIndex:props.RadiPOPstates.currentSliceIndex,
                              patient: props.RadiPOPstates.patient,
                              showMask: props.RadiPOPstates.files.length>0
                            });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMask]);


    const firstUpdate = useRef(true); // Avoid Log print on first render
    // Update Log after computing all new masks
    useEffect(() => {
      if (firstUpdate.current) {
        firstUpdate.current = false;
          return;
      }
      const logInfo = window.RP_vars.logInfo.concat(<LogMessage type="success" message="EditorXR updated all masks"/>);
      window.RP_vars.setlogInfo(logInfo);
      props.setRadiPOPstates({files: props.RadiPOPstates.files,
        slice_mask_container: props.RadiPOPstates.slice_mask_container,
        currentSliceIndex:props.RadiPOPstates.currentSliceIndex,
        patient:props.RadiPOPstates.patient,
        showMask:props.RadiPOPstates.showMask
      });
    setDisableApp(false); // After computation allow user to buttons/sliders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[checkGlobalUpdate]);

  function extendLabels(left,right) {
    console.log("LEFT", left);
    console.log("RIGHT", right);
    let current= props.RadiPOPstates.currentSliceIndex;
    let data ={index: current,left: left, right: right,"patientID": props.RadiPOPstates.patient};
    fetch(window.RP_vars.FLASK_SERVER+"/extendLabels", {
     method: 'POST',
     headers: { 'Content-Type': 'application/json'},
     body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})
    .then(function(data){
     console.log("DATA", data)
     console.log("RIFHT MOST", data["right_most_idx"])
     for (let index=parseInt(data["left_most_idx"]); index<parseInt(data["right_most_idx"])+1; index++) {
       console.log("INDEX", index);
       getMask(index);
     }
}).catch(error_handler)
}

  //Get mask of given index
  function getMask(target_slice_idx) {
    let data={
      "index": target_slice_idx,
      "patientID": props.RadiPOPstates.patient
    };
    fetch(window.RP_vars.FLASK_SERVER+"/getMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})
    .then(function(data){
      let bytestring = data["mask"];
      let img = bytestring.split('\'')[1];
      img= "data:image/png;base64," +img;
      setNewMask({mask: img, index: target_slice_idx});
    }).catch(error_handler)
  }

    return(
      <div className="col-lg-3 col-md-3 utility-area ">
        <HideMask key="HideMaskBox" RadiPOPstates={props.RadiPOPstates} setRadiPOPstates={p=>{props.setRadiPOPstates(p)}} disableApp={disableApp}/>
        <div className="tools">
          <Slider id="bone"
                  label="Bone Intensity:"
                  value={sliderValue.bone}
                  disableApp={disableApp}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus} />
          <Slider id="vessel"
                  label="Vessel Intensity:"
                  value={sliderValue.vessel}
                  disableApp={disableApp}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus} />
          <Slider id="liver"
                  label="Liver Intensity:"
                  value={sliderValue.liver}
                  disableApp={disableApp}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus}/>
          <GlobalThreshold label="Set threshold globally"
                          setThesholdGlobally={setThesholdGlobally}
                          setRadiPOPstates={p=>{props.setRadiPOPstates(p)}}
                          disableApp={disableApp}/>
        </div>
        <div className="tools">
          <SetLabel labelID={window.RP_vars.LIVER_LABEL} label="Set Liver Label" RadiPOPstates={props.RadiPOPstates} />
          <SetLabel labelID={window.RP_vars.SPLEEN_LABEL} label="Set Spleen Label" RadiPOPstates={props.RadiPOPstates} />
        </div>
        <div className="tools">
          <Bound disableApp={disableApp} extendLabelClick={extendLabelClick} getBounds={getBounds}/>
        </div>
      </div>
  );
}

export default Editing;
