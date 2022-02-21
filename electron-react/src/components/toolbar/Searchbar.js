import React from 'react';
import '../../styles/toolbar.css';
import search_icon from '../../assets/images/search_icon.jpg';


/**
 * Creates searchbar for Toolbar component
 * @memberof toolbar
 * @method SearchBar 
 * @param {*} props RP variable from App.js
 * @returns Searchbar div
 * @example
 * <SearchBar RP={props.RP} scrollRefs={props.RP.scrollRefs}/>
 */

function SearchBar(props){
/**
 * @namespace SearchBar
 */

  /**
   * Scroll to selected Slice after click on search icon
   * @memberof SearchBar
   * @method executeScroll
   */
   const executeScroll = () => {
     let scrollTo; // Variable to store scrollRefs
     let sel_slice = props.RP.RadiPOPstates.currentSliceIndex;
    // return if user loaded no files
    if(props.RP.RadiPOPstates.files.length === 0){
      return
    }
    // Center the scroll with offset 2
    if(sel_slice >= props.RP.RadiPOPstates.files.length - 2){
      scrollTo =  props.RP.scrollRefs.current[sel_slice]
    }
    else{
      scrollTo = props.RP.scrollRefs.current[sel_slice + 2]
    }
    scrollTo.current.scrollIntoView({ behavior: "smooth", block: "end"});
  };

  /**
   * Handles event where user enters slice index. 
   * @memberof SearchBar
   * @method handleSliceSearch
   * @param {*} event Event
   */
  const handleSliceSearch = (event) => {
    // Only slide on Enter
    if (event.key === 'Enter') {
     if(props.RP.RadiPOPstates.files.length === 0){
       return
    }
    let scrollTo; // Variable to store scrollRefs
    let sel_slice; // Variable to store user input "slice index"
    // Check if input is correct -> positive Integer
    if(Number.isInteger(+event.target.value) && +event.target.value > 0 && +event.target.value <= props.RP.RadiPOPstates.files.length){
      sel_slice = +event.target.value-1; // -1 offset to scroll in center
    }
    else{
      return
    }
     // Check if scrollRef with offset exists (last slices) and set offset to center
     if(sel_slice >= props.RP.RadiPOPstates.files.length - 2){
       scrollTo =  props.RP.scrollRefs.current[sel_slice]
     }
     else{
       scrollTo = props.RP.scrollRefs.current[sel_slice + 2]
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
