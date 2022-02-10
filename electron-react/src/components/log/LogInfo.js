import React from 'react';
import '../../styles/log.css';

function Log(props){
  const status = window.RP_vars.logInfo;
  const listItems = status.map((status,i) =>
  <li key={"LogInfo"+String(i)}>  {status}</li>
).reverse();
  return(
    <div key="LogInfo" className="log">
      <ul> {listItems} </ul>
    </div>

  );
}

export default Log;
