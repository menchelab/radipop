$(document).ready(function () {
  /* Event listener for automatically updating sliders */
  var slider1 = document.getElementById('bone-intensity-slider'); 
  slider1.output = document.getElementById('bone-intensity-slider-output'); 
  slider1.addEventListener('input', sliderChange); 

  var slider1_minus =  document.getElementById('bone-intensity-slider'); 
  var slider2 = document.getElementById('liver-intensity-slider'); 
  slider2.output = document.getElementById('liver-intensity-slider-output'); 
  slider2.addEventListener('input', sliderChange); 

  var slider3 = document.getElementById('blood-vessel-intensity-slider'); 
  slider3.output = document.getElementById('blood-vessel-intensity-slider-output'); 
  slider3.addEventListener('input', sliderChange); 


  /* Function to update slider values when slider is clicked on */
  function sliderChange(event) {
    var index = this.value
    event.currentTarget.output.innerHTML = index;
    // console.log(this.value);
    sliderChangeFlask(index,id=this.id);

  }

// Post data to flask server when slider changed 
  function sliderChangeFlask(index,id) {
    /*fetch(`http://localhost:4041/slider/${index}`)
        .then(function (response) {
            return response.text();
        }).then(function (text) {
            console.log('GET response text:');
            console.log(text); 
        });
      */  
    let data = {
      slider_value: index, 
      slider_id: id, 
      imagePath: document.getElementById("slice").src
    };
    $.post("http://localhost:4041/postmethod", {
      javascript_data: JSON.stringify(data)
    }, function(err, req, resp){
      console.log(resp);
    }).fail(function(xhr, status, error) {
      console.log("Failed to contact flask server");
      alert("Failed to contact flask server - It may take a few seconds to start up the server... Try again later.")
  });;
    
  }

  // get data from flask server after clicking hide_mask --> output to console
  var checkbox_hide_mask = document.getElementById("hide-mask-checkbox")
  checkbox_hide_mask.addEventListener("click",hide_mask)

  function hide_mask(event) {
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
        });;
  }

});


// Load image files into Previw sidebar 
document.getElementById("filepicker").addEventListener("change", function(event) {
  let files = event.target.files;
  files=[].slice.call(files).sort((a, b) => (parseInt(a.name.replace(".png","")) > parseInt(b.name.replace(".png",""))) ? 1 : -1 )
  var output = document.getElementById("scrollbar-area-preview")
  output.innerHTML=""
  document.getElementById("slice").src=URL.createObjectURL(files[0])
  for (let i=0; i<files.length; i++) {
    //console.log(files[i].path);
    console.log(files[i].name)
    item= document.createElement("img");
    item.src=URL.createObjectURL(files[i]);
    item.id="slice_"+i;
    output.appendChild(item);
    document.getElementById("slice_"+i).addEventListener("mouseover", function(event) {
      document.getElementById("slice").src=URL.createObjectURL(files[i]); //files[i].path;
    });
  };
}, false);

