import React from 'react';
import '../../styles/toolbar.css';
import search_icon from '../../assets/images/search_icon.jpg';



function SearchBar(props){
   // Scroll to selected Slice with click on search icon
   const executeScroll = (index) => {
     let scrollTo; // Variable to store scrollRefs
     let sel_slice = props.RadiPOPstates.currentSliceIndex;
    // return if user loaded no files
    if(props.RadiPOPstates.files.length === 0){
      return
    }
    // Center the scroll with offset 2
    if(sel_slice >= props.RadiPOPstates.files.length - 2){
      scrollTo =  props.scrollRefs.current[sel_slice]
    }
    else{
      scrollTo = props.scrollRefs.current[sel_slice + 2]
    }
    scrollTo.current.scrollIntoView({ behavior: "smooth", block: "end"});
  };

  // Scrolls to
  const handleSliceSearch = (event) => {
    // Only slide on Enter
    if (event.key === 'Enter') {
     if(props.RadiPOPstates.files.length === 0){
       return
    }
    let scrollTo; // Variable to store scrollRefs
    let sel_slice; // Variable to store user input "slice index"
    // Check if input is correct -> positive Integer
    if(Number.isInteger(+event.target.value) && +event.target.value > 0 && +event.target.value <= props.RadiPOPstates.files.length){
      sel_slice = +event.target.value-1; // -1 offset to scroll in center
    }
    else{
      return
    }
     // Check if scrollRef with offset exists (last slices) and set offset to center
     if(sel_slice >= props.RadiPOPstates.files.length - 2){
       scrollTo =  props.scrollRefs.current[sel_slice]
     }
     else{
       scrollTo = props.scrollRefs.current[sel_slice + 2]
     }
     scrollTo.current.scrollIntoView({ behavior: "smooth", block: "end"});
   }
 }

    return (
      <div className="tool-col">
      <input className="search" onClick={executeScroll} alt="seatch-icon" type="image" src={search_icon} />
      <input className="searchbar" onKeyDown={handleSliceSearch} type="text" placeholder="Go to slice.." />
      </div>
  );
}
export default SearchBar;
