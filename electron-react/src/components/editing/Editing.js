import React, {useState, useEffect} from 'react';
import HideMask from '../editing/HideMask.js';
import Slider from '../editing/Slider.js'
import GlobalThreshold from '../editing/GlobalThreshold.js';
import Bound from '../editing/Bound.js';
import SetLabel from '../editing/SetLabel.js';
import '../../styles/editing.css';
import '../../styles/index.css';




function Editing(props) {
    const [sliderValue, setSliderValue] = useState({
      bone: '255',
      vessel: '180',
      liver: '100',
    });
    const [newMask, setNewMask] = useState('');

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

    // Update the mask. Function should be called when the intensity sliders change.
    // RadiPOP segmenter will calculate a new mask --> update mask in main window
    const updateMask = (target_slice_idx, value, patientID="1") => {
      let data={
        "patientID": patientID,
        "bone-intensity-slider": value.bone,
        "liver-intensity-slider": value.liver,
        "blood-vessel-intensity-slider": value.vessel,
        "index": target_slice_idx
      };
      fetch("http://localhost:4041"+"/updateMask", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(response){ return response.json();})
      .then(function(data) {
        let bytestring = data["mask"];
        let img = bytestring.split('\'')[1];
        img= "data:image/png;base64," +img;
        setNewMask(img);
      }).catch(error_handler)
    }

    //Function is raised when requests to Flask server fail for any reason
    const error_handler = () => {
      console.log("Failed to contact flask server or Flask handling error");
      //alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
    }

    useEffect(() => {
      updateMask(props.RadiPOPstates.currentSliceIndex, sliderValue);
    },[sliderValue]);

    useEffect(() => {
      let update = props.RadiPOPstates.slice_mask_container;
      update[props.RadiPOPstates.currentSliceIndex][1] = newMask;
      props.setRadiPOPstates({files: props.RadiPOPstates.files,
                              slice_mask_container: update,
                              currentSliceIndex:props.RadiPOPstates.currentSliceIndex,
                              patient: props.RadiPOPstates.showMask.patient,
                              showMask: props.RadiPOPstates.files.length>0,
                              status: props.RadiPOPstates.status});
    }, [newMask]);

    return(
      <div className="col-lg-3 col-md-3 utility-area ">
        <HideMask key="HideMaskBox" RadiPOPstates={props.RadiPOPstates} setRadiPOPstates={p=>{props.setRadiPOPstates(p)}}/>
        <div className="tools">
          <Slider id="bone" label="Bone Intensity:" value={sliderValue.bone} handleSlide={handleSlide} handleClickPlus={handleClickPlus} handleClickMinus={handleClickMinus} />
          <Slider id="vessel" label="Vessel Intensity:" value={sliderValue.vessel} handleSlide={handleSlide} handleClickPlus={handleClickPlus} handleClickMinus={handleClickMinus} />
          <Slider id="liver" label="Liver Intensity:" value={sliderValue.liver} handleSlide={handleSlide} handleClickPlus={handleClickPlus} handleClickMinus={handleClickMinus}/>
          <GlobalThreshold label="Set threshold globally"/>
        </div>
        <div className="tools">
          <SetLabel label="Set Liver Label"/>
          <SetLabel label="Set Spleen Label"/>
        </div>
        <div className="tools">
          <Bound/>
        </div>
      </div>
  );
}

export default Editing;
