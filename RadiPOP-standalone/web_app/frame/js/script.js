$(document).ready(function () {
  /* Global variables */
  var RadiPOP_states={};
  RadiPOP_states.FLASK_SERVER="http://localhost:4041"
  RadiPOP_states.slider_id= ["bone-intensity-slider","blood-vessel-intensity-slider","liver-intensity-slider"]
  RadiPOP_states.masks = {};
  RadiPOP_states.outDir="temp"
  RadiPOP_states.slice_files = {};
  RadiPOP_states.current_slice_idx =0; 
  RadiPOP_states.LIVER_LABEL=1;
  RadiPOP_states.SPLEEN_LABEL=2;
  RadiPOP_states.correct_partition=false; 
  RadiPOP_states.selected_points=[]; 

  /* Event listener for automatically updating sliders */
  for (let i=0; i<RadiPOP_states.slider_id.length; i++) {
    var slider = document.getElementById(RadiPOP_states.slider_id[i]); 
    slider.output = document.getElementById(RadiPOP_states.slider_id[i]+"-output"); 
    slider.addEventListener('input', sliderChange); 
  }
 
  /* Function to update slider values when slider is clicked on */
  function sliderChange(event) {
    event.currentTarget.output.innerHTML = this.value;
    this.step=5;
    updateMask(target_slice_idx=RadiPOP_states.current_slice_idx);
  }

  //Add function to slider button
  for (let i=0; i<RadiPOP_states.slider_id.length; i++) {
    document.getElementById(RadiPOP_states.slider_id[i]+"-plus").addEventListener("click", () =>{
      document.getElementById(RadiPOP_states.slider_id[i]).step=1;
      document.getElementById(RadiPOP_states.slider_id[i]).value++;
      document.getElementById(RadiPOP_states.slider_id[i]+"-output").innerHTML=document.getElementById(RadiPOP_states.slider_id[i]).value;
      updateMask(target_slice_idx=RadiPOP_states.current_slice_idx);
    }) 
    document.getElementById(RadiPOP_states.slider_id[i]+"-minus").addEventListener("click", () =>{
      document.getElementById(RadiPOP_states.slider_id[i]).step=1;
      document.getElementById(RadiPOP_states.slider_id[i]).value--;
      document.getElementById(RadiPOP_states.slider_id[i]+"-output").innerHTML=document.getElementById(RadiPOP_states.slider_id[i]).value;
      updateMask(target_slice_idx=RadiPOP_states.current_slice_idx);
    }) 
  }


  // Add function to hide mask checkbox --> hide all divs belonging to class mask 
  document.getElementById("hide-mask-checkbox").addEventListener("click",() =>{
    let all_masks= document.querySelectorAll("img.mask")
    let style= (all_masks[0].style.visibility=="hidden"?"visible":"hidden");
    for (let i = 0; i < all_masks.length; i++) {
      all_masks[i].style.visibility=style;
    }
  });




  // Load image files into Preview sidebar 
  document.getElementById("filepicker").addEventListener("change", function(event) {
    let files = event.target.files;
    let mask_files=[]
    let slice_files=[]

    //Filter input files to slice and mask files 
    for (let i=0; i<files.length; i++) {
      if (files[i].name.endsWith(".png")) {
        slice_files.push(files[i])
      }
      if (files[i].name.endsWith(".p")) {
        mask_files.push(files[i])
      }
    }
    //Order files according to their index 
    RadiPOP_states.slice_files=[].slice.call(slice_files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    mask_files=[].slice.call(mask_files).sort((a, b) => (parseInt(a.name.replace(".p","")) > parseInt(b.name.replace(".p",""))) ? 1 : -1 )
    //Set default output directory 

    RadiPOP_states.outDir=slice_files[0].path.substring(0, slice_files[0].path.lastIndexOf("/")+1);
    //Post slice file paths to flask --> will be loaded and chached 
    let slice_files_paths  = RadiPOP_states.slice_files.map((item) => item.path);
    initialize(slice_files_paths);
    
    //Slices will be added to the preview area  
    var output = document.getElementById("scrollbar-area-preview")
    output.innerHTML=""
    for (let i=0; i<RadiPOP_states.slice_files.length; i++) {
      let item= document.createElement("div");
      item.classList.add("slice-mask-container")
      item.id="slice_"+i;
      let subitem1=document.createElement("img");
      subitem1.src=RadiPOP_states.slice_files[i].path; //Address only valid inside browser URL.createObjectURL(slice_files[i])
      let subitem2=document.createElement("img");
      subitem2.id="mask-"+i; 
      subitem2.classList.add("mask")
      if (i<mask_files.length) { //When there are no masks in the input folder don't try to load them 
        postPickleGetMask(index=i, path=mask_files[i].path,target=subitem2) //.path only available in electron browser
      } 
      
      item.appendChild(subitem1)
      item.appendChild(subitem2)
      output.appendChild(item);
      item.addEventListener("mouseover", function(event) { //Update slices and mask in main view on mouse over 
        document.getElementById("slice").src=subitem1.src; //slice_files[i].path;
        document.getElementById("mask").src=subitem2.src;
        RadiPOP_states.current_slice_idx=i; 
      });
      //Let last slice be on the main screen 
      document.getElementById("slice").src=subitem1.src;
      document.getElementById("mask").src=subitem2.src
      RadiPOP_states.current_slice_idx=RadiPOP_states.slice_files.length-1
    };
  }, false);


  // Updates Mask for given intensity values
  document.getElementById("global-threshold-button").addEventListener("click", function(event) {
    for (let i=0; i<RadiPOP_states.slice_files.length; i++) {
      let current_slice= String(i)
      updateMask(target_slice_idx=current_slice); 
    }
  });

  document.getElementById("mask").addEventListener("click", function(event) {
    var x = event.offsetX/this.width;
    var y = event.offsetY/this.height;

    if (!RadiPOP_states.correct_partition) {
      console.log("Highlighing mode");
      highlightOrgan(x=x,y=y);
    }
    else {
      console.log("Correct partition mode");
      RadiPOP_states.selected_points.push(x); 
      RadiPOP_states.selected_points.push(y); 
      if (RadiPOP_states.selected_points.length/2>1){
        document.getElementById("correct-partition-button").innerHTML="Commit correction";
      }
      drawOnMask(target_slice_idx=RadiPOP_states.current_slice_idx,coordinates=RadiPOP_states.selected_points)
    }
  });
  
  //Assign event listeners to label buttons 
  document.getElementById("liver-label-button").addEventListener("click", ()=>{labelButton(label=RadiPOP_states.LIVER_LABEL)});
  document.getElementById("spleen-label-button").addEventListener("click", ()=>{labelButton(label=RadiPOP_states.SPLEEN_LABEL)});

  function labelButton(label) {
    if (!RadiPOP_states.correct_partition) {
      console.log("Button with id was pressed: " + label );
      labelOrgan(label);
    }
    else {
      alert("Labelling not available in correct partition mode!");
    }
  };

  //Assign event listeners to correct parition buttons 
  document.getElementById("correct-partition-button").addEventListener("click", ()=>{
    if (!RadiPOP_states.correct_partition){
      RadiPOP_states.correct_partition=true
      console.log("Correct Partition mode enabled")
      document.getElementById("correct-partition-button").innerHTML="End Correct Partition";
    }
    else {
      if (RadiPOP_states.selected_points.length/2>1) {
        console.log("Commit correction")
        correctPartition(target_slice_idx=RadiPOP_states.current_slice_idx,coordinates=RadiPOP_states.selected_points)
      }
      else {
        console.log("Correct Partition mode disabled")
      }
      document.getElementById("correct-partition-button").innerHTML="Correct Partition";
      RadiPOP_states.correct_partition=false;
      RadiPOP_states.selected_points=[];
      getMask(target_slice_idx=RadiPOP_states.current_slice_idx)
      
    }
  });

  document.getElementById("clear-edits-button").addEventListener("click", ()=>{
    if (RadiPOP_states.correct_partition) {
      RadiPOP_states.selected_points=[]; 
      document.getElementById("correct-partition-button").innerHTML="End Correct Partition";
      getMask(target_slice_idx=RadiPOP_states.current_slice_idx)
      console.log("Clear edits button was pressed");
    }
    else {
      alert("Clear edits only available in correct partition mode!");
    }
  });

  document.getElementById("extend-label-button").addEventListener("click", ()=>{
    left=document.getElementById("left_expansion_bound_input").value;
    right=document.getElementById("right_expansion_bound_input").value;
    console.log(left);
    console.log(right);
    extendThresholds(left,right)
  }); 

  document.getElementById("save-button").addEventListener("click", () =>{
    outDir=RadiPOP_states.outDir; 
    saveMasks(path=outDir);
    console.log("Saved files to: "+ outDir);
  })
  /* 
  ***********************************
  ** Flask requests starting here ***
  ***********************************
  */

    //Save masks 
    //If path is given as empty string the output dir will be the same directory as the masks 
    function saveMasks(path,patientID="1") {
      let data={"path": path, "patientID": patientID};
      fetch(RadiPOP_states.FLASK_SERVER+"/saveMasks", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(function(response){ return response.json();})   
      .then(function(data){                                        
        console.log(data)
      }).catch(error_handler)
    }

    //Correct partition  mask 
    function correctPartition(target_slice_idx,coordinates,patientID="1") {
      let data={
        "patientID": patientID,
        "index": target_slice_idx,
        "coordinates": coordinates
      };
      let index= target_slice_idx
      let target1= document.getElementById("mask"); //Must be let and NOT var --> otherwise problems with async function
      let target2= document.getElementById("mask-"+target_slice_idx)
      fetch(RadiPOP_states.FLASK_SERVER+"/correctPartition", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(function(response){ return response.json();})   
      .then(function(data){                      
      bytestring = data["mask"];
        img = bytestring.split('\'')[1]   
        RadiPOP_states.masks[index]="data:image/png;base64," + img; 
        if (target_slice_idx==RadiPOP_states.current_slice_idx){
          target1.src = RadiPOP_states.masks[index];
        }
        target2.src = RadiPOP_states.masks[index];
      }).catch(error_handler)
    }

   //Draw on mask 
   function drawOnMask(target_slice_idx,coordinates,patientID="1") {
    let data={
      "patientID": patientID,
      "index": target_slice_idx,
      "coordinates": coordinates
    };
    let index= target_slice_idx
    let target1= document.getElementById("mask"); //Must be let and NOT var --> otherwise problems with async function
    let target2= document.getElementById("mask-"+target_slice_idx)
    fetch(RadiPOP_states.FLASK_SERVER+"/drawOnMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})   
    .then(function(data){                      
      bytestring = data["mask"];
      img = bytestring.split('\'')[1];
      RadiPOP_states.masks[index]="data:image/png;base64," + img; 
      if (target_slice_idx==RadiPOP_states.current_slice_idx){
        target1.src = RadiPOP_states.masks[index];
      }
      target2.src = RadiPOP_states.masks[index];
    }).catch(error_handler)
  }

   //Label highlighted organ as id
   function extendThresholds(left,right,patientID="1") {
    let index= RadiPOP_states.current_slice_idx;
    let data ={index: index,left: left, right: right,"patientID": patientID};
    fetch(RadiPOP_states.FLASK_SERVER+"/extendThresholds", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})   
    .then(function(data){           
      console.log(data["left_most_idx"])   
      console.log(data["right_most_idx"])   
      for (let index=parseInt(data["left_most_idx"]); index<parseInt(data["right_most_idx"])+1; index++) {     
        getMask(index);
      }
    }).catch(error_handler)
  }

  //Label highlighted organ as id
  function labelOrgan(label,patientID="1") {
    let index= RadiPOP_states.current_slice_idx;
    let data = {index: index,label: label,"patientID": patientID};
    let target1= document.getElementById("mask"); 
    let target2= document.getElementById("mask-"+index);
    fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})   
    .then(function(data){                      
      bytestring = data["mask"];
      img = bytestring.split('\'')[1]
      RadiPOP_states.masks[index]="data:image/png;base64," + img; 
      if (index==RadiPOP_states.current_slice_idx){
        target1.src = RadiPOP_states.masks[index];
      }
      target2.src = RadiPOP_states.masks[index];
    }).catch(error_handler)
  }

  //Highlight organ: Post x and y coordinates to current slice get highligthed mask back 
  function highlightOrgan(x,y,patientID="1") {
    let target= document.getElementById("mask"); 
    let data = {index: RadiPOP_states.current_slice_idx,x: x, y: y,"patientID": patientID};
    path= document.getElementById("slice").src
    console.log(path);
    console.log(RadiPOP_states.current_slice_idx);
    fetch(RadiPOP_states.FLASK_SERVER+"/highlightOrgan", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})   
    .then(function(data){                      
      bytestring = data["mask"];
      img = bytestring.split('\'')[1];
      target.src="data:image/png;base64," + img; 
    }).catch(error_handler)
  }

  //Get mask of given index 
  function getMask(target_slice_idx,patientID="1") {
    let data={
      "index": target_slice_idx,
      "patientID": patientID
    };
    let index= target_slice_idx
    let target1= document.getElementById("mask"); //Must be let and NOT var --> otherwise problems with async function
    let target2= document.getElementById("mask-"+target_slice_idx)
    fetch(RadiPOP_states.FLASK_SERVER+"/getMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();})   
    .then(function(data){                      
      bytestring = data["mask"];
      img = bytestring.split('\'')[1];
      RadiPOP_states.masks[index]="data:image/png;base64," + img; 
      if (target_slice_idx==RadiPOP_states.current_slice_idx){
        target1.src = RadiPOP_states.masks[index];
      }
      target2.src = RadiPOP_states.masks[index];
    }).catch(error_handler)
  }

  // Post the path to a mask pickle file and get a transparent PNG file in return 
  function postPickleGetMask(index, path, target,patientID="1") {
    let data = {index: index, path: path,"patientID": patientID};
    fetch(RadiPOP_states.FLASK_SERVER+"/postPickleGetMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();  })   
    .then(function(data){     
      bytestring = data["mask"];
      img = bytestring.split('\'')[1];
      RadiPOP_states.masks[index]="data:image/png;base64," + img; 
      target.src = RadiPOP_states.masks[index]; 
    }).catch(error_handler)
  }

  // Post path to slice files to flask --> flask opens the slices and chaches them 
  function initialize(paths,patientID="1") {
    let data={
      paths: paths,
      "patientID": patientID
    };
    fetch(RadiPOP_states.FLASK_SERVER+"/initialize", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(response){ return response.json();  })   
    .then(function(data){ console.log(data["message"]); })
    .catch(error_handler)
  }

  // Update the mask. Function should be called when the intensity sliders change. 
  // RadiPOP segmenter will calculate a new mask --> update mask in main window
  function updateMask(target_slice_idx,patientID="1") {
    let data={
      "patientID": patientID,
      "bone-intensity-slider": document.getElementById("bone-intensity-slider").value,
      "liver-intensity-slider": document.getElementById("liver-intensity-slider").value,
      "blood-vessel-intensity-slider": document.getElementById("blood-vessel-intensity-slider").value,
      "index": target_slice_idx
    };
    let index= target_slice_idx;
    let target1= document.getElementById("mask"); //Must be let and NOT var --> otherwise problems with async function
    let target2= document.getElementById("mask-"+target_slice_idx);
    fetch(RadiPOP_states.FLASK_SERVER+"/updateMask", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(response){ return response.json();})   
    .then(function(data){ 
      bytestring = data["mask"];
      img = bytestring.split('\'')[1]; 
      RadiPOP_states.masks[index]="data:image/png;base64," + img; 
      if (target_slice_idx==RadiPOP_states.current_slice_idx){
        target1.src = RadiPOP_states.masks[index];
      }
      target2.src = RadiPOP_states.masks[index];
    }).catch(error_handler)
  }
  
  //Function is raised when requests to Flask server fail for any reason 
  function error_handler(){
    console.log("Failed to contact flask server or Flask handling error");
    alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.");
  }

  //Expose RadiPOP_states for debugging purposes
  $.RadiPOP_states=RadiPOP_states
});



//Code Fragments 
/* First functional code :)
document.getElementById("global-threshold-button").addEventListener("click", function(event) {
  fetch('http://localhost:4041/postPickleGetMask')
    .then(function (response) {
      return response.json();
    })
    .then(function(data){                     
      bytestring = data['status']
			img = bytestring.split('\'')[1]   
      var image = document.getElementById("mask");  
      image.src = "data:image/png;base64," + img;  
    })
});
*/

/*
var input_slices=[]
let default_slice="images/sample_slice.png" 
//Draw image on canvas
make_base(default_slice);
function make_base(path){
  var canvas = document.getElementById("slice"),
  context = canvas.getContext("2d");
  base_image = new Image();
  base_image.src = path;
  console.log(base_image)
  base_image.onload = function(){
    canvas.width = this.width;
    canvas.height = this.height;
    context.drawImage(base_image,0,0);
  }
  input_slices.push(base_image)
}


function draw_on_canvas(){
  var canvas = document.getElementById("slice"),
  context = canvas.getContext("2d");
  context.globalAlpha = 0.5; // transparency
  var imgData = context.createImageData(300, 300);
  var i;
  for (i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i+0] = 255;
    imgData.data[i+1] = 0;
    imgData.data[i+2] = 0;
    imgData.data[i+3] = 255; 
  }
  console.log(imgData.data.length)
  context.drawImage(imgData, 10, 10);
}


fetch('http://localhost:4041/getmethod')
          .then(function (response) {
              return response.json();
          }).then(function (text) {
              console.log('GET response:');
              console.log(text.slider_value); 
              alert("Values of sliders stored on Flask server:\r\n" + text.slider_value)
          }).catch(function() {
            console.log("Failed to contact flask server");
            alert("Failed to contact flask server - It may take a few seconds to start up the server... Try again later.")
        });

fetch('http://localhost:4041/getmethod')
.then(function (response) {
    return response.json();
}).then(function (text) {
    console.log('GET response:');
    console.log(text.slider_value); 
    alert("Values of sliders stored on Flask server:\r\n" + text.slider_value)
}).catch(function() {
  console.log("Failed to contact flask server");
  alert("Failed to contact flask server - It may take a few seconds to start up the server... Try again later.")
});
*/
