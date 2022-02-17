import React, {useState, useEffect, useRef} from 'react';
import HideMask from '../editing/HideMask.js';
import HideSlice from './HideSlice.js';
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
      down: 0,
    });

    const [newMask, setNewMask] = useState({mask:'', index:props.RP.RadiPOPstates.currentSliceIndex});
    const [checkGlobalUpdate, setGlobalUpdate] = useState(false) //State to check if all Thresholds are set

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
      // Check if user loaded files if not -> return
      if(props.RP.RadiPOPstates.files.length === 0){
        return
      }
      const logInfo = props.RP.logInfo.concat(<LogMessage type="warning" message={"Setting threshold for " + String(props.RP.RadiPOPstates.files.length) +" slices..."}/>);
      props.RP.setlogInfo(logInfo);
      props.RP.setDisableApp(true); //Disable buttons/sliders during computation
      for (let i=0; i<props.RP.RadiPOPstates.slice_mask_container.length; i++) {
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
      if(props.RP.RadiPOPstates.files.length === 0){
        return
      }

      if(expansionBounds.up === '' || expansionBounds.down === '') {
        const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message={"Please set expansion bounds"}/>);
        props.RP.setlogInfo(logInfo);
        return;
    }

      extendLabels(expansionBounds.up, expansionBounds.down)
    }

    // Update the mask. Function should be called when the intensity sliders change.
    // RadiPOP segmenter will calculate a new mask --> update mask in main window
    const updateMask = (target_slice_idx, value, global) => {

      let data={
        "patientID": props.RP.RadiPOPstates.patient,
        "bone-intensity-slider": value.bone,
        "liver-intensity-slider": value.liver,
        "blood-vessel-intensity-slider": value.vessel,
        "index": target_slice_idx
      };
      fetch(props.RP.FLASK_SERVER+"/updateMask", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(response){ return response.json();})
      .then(function(data) {
        let bytestring = data["mask"];
        let img = bytestring.split('\'')[1];
        img= "data:image/png;base64," +img;
        setNewMask({mask: img, index: target_slice_idx});
        if (global === true && +target_slice_idx === props.RP.RadiPOPstates.slice_mask_container.length-1){
           setGlobalUpdate(!checkGlobalUpdate);
           const logInfo = props.RP.logInfo.concat(<LogMessage type="success" message="EditorXR updated all masks"/>);
           props.RP.setlogInfo(logInfo);
        }
      }).catch(error_handler)
    }

    //Function is raised when requests to Flask server fail for any reason
    const error_handler = () => {
      props.RP.setDisableApp(false);
      const logInfo = props.RP.logInfo.concat(<LogMessage type="error" message="Failed to contact flask server or Flask handling error"/>);
      props.RP.setlogInfo(logInfo);
      console.log("Failed to contact flask server or Flask handling error");
      //alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
    }

    // Updates Mask on slider change
    useEffect(() => {
      if (props.RP.flaskIntialized){
        updateMask(props.RP.RadiPOPstates.currentSliceIndex, sliderValue, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[sliderValue]);

    // Render new mask after computation
    useEffect(() => {
      let update = props.RP.RadiPOPstates.slice_mask_container;
      update[newMask.index][1] = newMask.mask;
      props.RP.setRadiPOPstates({files: props.RP.RadiPOPstates.files,
                              slice_mask_container: update,
                              currentSliceIndex:props.RP.RadiPOPstates.currentSliceIndex,
                              patient: props.RP.RadiPOPstates.patient
                            });
      props.RP.setshowMask(props.RP.RadiPOPstates.files.length>0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMask]);


    const firstUpdate = useRef(true); // Avoid Log print on first render
    // Update Log after computing all new masks
    useEffect(() => {
      if (firstUpdate.current) {
        firstUpdate.current = false;
          return;
      }
      props.RP.setRadiPOPstates({files: props.RP.RadiPOPstates.files,
        slice_mask_container: props.RP.RadiPOPstates.slice_mask_container,
        currentSliceIndex:props.RP.RadiPOPstates.currentSliceIndex,
        patient:props.RP.RadiPOPstates.patient
      });
    props.RP.setDisableApp(false); // After computation allow user to buttons/sliders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[checkGlobalUpdate]);

  function extendLabels(left,right) {
    const logInfo = props.RP.logInfo.concat(<LogMessage type="warning" message={"Extending labels.."}/>);
    props.RP.setlogInfo(logInfo);
    props.RP.setDisableApp(true);
    let current= props.RP.RadiPOPstates.currentSliceIndex;
    let data ={index: current,left: left, right: right,"patientID": props.RP.RadiPOPstates.patient};
    fetch(props.RP.FLASK_SERVER+"/extendLabels", {
     method: 'POST',
     headers: { 'Content-Type': 'application/json'},
     body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})
    .then(function(data){
     for (let index=parseInt(data["left_most_idx"]); index<parseInt(data["right_most_idx"])+1; index++) {
       getMask(index);
       if(index === parseInt(data["right_most_idx"])){
         const logInfo = props.RP.logInfo.concat(<LogMessage type="success" message={"EditorXR extended liver/spleen labels on slices " + String(data["left_most_idx"] + 1) + " - " + String(data["right_most_idx"] + 1)}/>);
         props.RP.setlogInfo(logInfo);
         props.RP.setDisableApp(false);
       }
     }
}).catch(error_handler)
}

  //Get mask of given index
  function getMask(target_slice_idx) {
    let data={
      "index": target_slice_idx,
      "patientID": props.RP.RadiPOPstates.patient
    };
    fetch(props.RP.FLASK_SERVER+"/getMask", {
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
        <div className="toolsh">
        <HideMask key="HideMaskBox" RP={props.RP}/>
        <HideSlice key="HideSliceBox" RP={props.RP}/>
        </div>
        <div className="tools">
          <Slider id="bone"
                  RP={props.RP}
                  label="Bone Intensity:"
                  value={sliderValue.bone}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus} />
          <Slider id="vessel"
                  RP={props.RP}
                  label="Vessel Intensity:"
                  value={sliderValue.vessel}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus} />
          <Slider id="liver"
                  RP={props.RP}
                  label="Liver Intensity:"
                  value={sliderValue.liver}
                  handleSlide={handleSlide}
                  handleClickPlus={handleClickPlus}
                  handleClickMinus={handleClickMinus}/>
          <GlobalThreshold label="Set threshold globally"
                          setThesholdGlobally={setThesholdGlobally}
                          RP={props.RP}/>
        </div>
        <div className="tools">
          <SetLabel labelID={props.RP.LIVER_LABEL}  RP={props.RP} />
          <SetLabel labelID={props.RP.SPLEEN_LABEL} RP={props.RP} />
        </div>
        <div className="tools">
          <Bound RP={props.RP} extendLabelClick={extendLabelClick} getBounds={getBounds}/>
        </div>
      </div>
  );
}

export default Editing;
