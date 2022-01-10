import React from 'react';
import '../../styles/log.css';

function Log(props){
  const status = props.RadiPOPstates.status;
  const listItems = status.map((status) =>
  <li>{status}</li>
).reverse();
  return(
    <div className="log">
      <ul> {listItems} </ul>
    </div>

  );
}

export default Log;
