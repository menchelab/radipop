$(document).ready(function () {
  /* Global variables */
  var FLASK_SERVER="http://localhost:4041"
  var slider_id= ["bone-intensity-slider","blood-vessel-intensity-slider","liver-intensity-slider"]


  /* Event listener for automatically updating sliders */
  for (let i=0; i<slider_id.length; i++) {
    var slider = document.getElementById(slider_id[i]); 
    slider.output = document.getElementById(slider_id[i]+"-output"); 
    slider.addEventListener('input', sliderChange); 
  }
 
  /* Function to update slider values when slider is clicked on */
  function sliderChange(event) {
    event.currentTarget.output.innerHTML = this.value;
    updateMask();
  }

  //Add function to slider button
  for (let i=0; i<slider_id.length; i++) {
    document.getElementById(slider_id[i]+"-plus").addEventListener("click", () =>{
      document.getElementById(slider_id[i]).value++;
      document.getElementById(slider_id[i]+"-output").innerHTML=document.getElementById(slider_id[i]).value;
      updateMask();
    }) 
    document.getElementById(slider_id[i]+"-minus").addEventListener("click", () =>{
      document.getElementById(slider_id[i]).value--;
      document.getElementById(slider_id[i]+"-output").innerHTML=document.getElementById(slider_id[i]).value;
      updateMask();
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
    slice_files=[].slice.call(slice_files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    mask_files=[].slice.call(mask_files).sort((a, b) => (parseInt(a.name.replace(".p","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
    
    //Post slice file paths to flask --> will be loaded and chached 
    let slice_files_paths  = slice_files.map((item) => item.path);
    postPathToSlices(slice_files_paths);
    
    //Slices will be added to the preview area  
    var output = document.getElementById("scrollbar-area-preview")
    output.innerHTML=""
    for (let i=0; i<slice_files.length; i++) {
      let item= document.createElement("div");
      item.classList.add("slice-mask-container")
      item.id="slice_"+i;
      let subitem1=document.createElement("img");
      subitem1.src=slice_files[i].path; //Address only valid inside browser URL.createObjectURL(slice_files[i])
      let subitem2=document.createElement("img");
      subitem2.classList.add("mask")
      if (i<mask_files.length) { //When there are no masks in the input folder don't try to load them 
        postPickleGetMask(path=mask_files[i].path,target=subitem2) //.path only available in electron browser
      } 
      item.appendChild(subitem1)
      item.appendChild(subitem2)
      output.appendChild(item);
      item.addEventListener("mouseover", function(event) {
        document.getElementById("slice").src=subitem1.src; //slice_files[i].path;
        document.getElementById("mask").src=subitem2.src;
      });
      //Let last slice be on the main screen 
      document.getElementById("slice").src=subitem1.src;
      document.getElementById("mask").src=subitem2.src
    
    };
  }, false);


  // Currently just dummy function --> Loads a predefined mask 
  document.getElementById("global-threshold-button").addEventListener("click", function(event) {
    let image = document.getElementById("mask");  
    postPickleGetMask( path="web_app/frame/images/0.p",target=image);
  });


  /* 
  ***********************************
  ** Flask requests starting here ***
  ***********************************
  */

  // Post the path to a mask pickle file and get a transparent PNG file in return 
  function postPickleGetMask(path, target) {
    $.post(FLASK_SERVER+"/postPickleGetMask", {
      javascript_data: JSON.stringify({path: path})
    })
    .done(function(data){                     
      bytestring = data['status']
      img = bytestring.split('\'')[1]   
      target.src = "data:image/png;base64," + img; 
    }).catch(error_handler)
  }

  // Post path to slice files to flask --> flask opens the slices and chaches them 
  function postPathToSlices(paths) {
    $.post(FLASK_SERVER+"/postPathToSlices", {
      javascript_data: JSON.stringify(paths)
    }).catch(error_handler)
  }

  // Update the mask. Function should be called when the intensity sliders change. 
  // RadiPOP segmenter will calculate a new mask --> update mask in main window
  function updateMask() {
    let data={
      "bone-intensity-slider": document.getElementById("bone-intensity-slider").value,
      "liver-intensity-slider": document.getElementById("liver-intensity-slider").value,
      "blood-vessel-intensity-slider": document.getElementById("blood-vessel-intensity-slider").value,
      "path": document.getElementById("slice").src
    };
    target= document.getElementById("mask");
    $.post(FLASK_SERVER+"/updateMask", {
      javascript_data: JSON.stringify(data)
    })
    .done(function(data){                     
      bytestring = data['status']
      img = bytestring.split('\'')[1]   
      target.src = "data:image/png;base64," + img; 
    }).catch(error_handler)
  }
  
  //Function is raised when requests to Flask server fail for any reason 
  function error_handler(){
    console.log("Failed to contact flask server or Flask handling error");
    alert("Failed to contact flask server or Flask handling error - It may take a while to start up the server... Try again later.")
  }

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