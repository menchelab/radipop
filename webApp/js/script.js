
/* Event listener for automatically updating sliders */
var slider = document.getElementById('bone-intensity-slider'); 
slider.output = document.getElementById('bone-intensity-slider-output'); 
slider.addEventListener('input', sliderChange); 

var slider2 = document.getElementById('liver-intensity-slider'); 
slider2.output = document.getElementById('liver-intensity-slider-output'); 
slider2.addEventListener('input', sliderChange); 

var slider3 = document.getElementById('blood-vessel-intensity-slider'); 
slider3.output = document.getElementById('blood-vessel-intensity-slider-output'); 
slider3.addEventListener('input', sliderChange); 


/* Function to update slider values */
function sliderChange(event) {
  event.currentTarget.output.innerHTML = this.value;
  // console.log(this.value);
}