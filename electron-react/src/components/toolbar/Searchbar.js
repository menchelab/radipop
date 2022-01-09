import React from 'react';
import '../../styles/toolbar.css';
import search_icon from '../../assets/images/search_icon.jpg';


function SearchBar(props) {

   const executeScroll = (props) => {
    // Here we want to scroll to the current selected slice
    //element = document.getElementById("{props.RadiPoPstates.currentSliceIndex}")
    //element.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
 }
    return (
      <div className="tool-col">
      <input className="search" onClick={executeScroll} alt="seatch-icon" type="image" src={search_icon} />
      <input className="searchbar" type="text" placeholder="Go to slice.." />
      </div>
  );
}
export default SearchBar;
