import React, {useState} from 'react';
import './styles/App.css';
import './styles/index.css';
import ToolBar from './components/toolbar/Toolbar.js';
import Editing from './components/editing/Editing.js';
import Display from './components/display/Display.js';
import importImg from './assets/images/editor_placeholder.png';
import importPlaceholder from './assets/images/preview_placeholder.png';



function App() {
  // States for loaded Files: files-> .png + .p unordered, masks-> .p ordered, slices-> .png ordered
  const [selectedFile, setSelectedFile] = useState({files: [], masks: [], slices: [importPlaceholder]});
  // State for image in MainDisplay (Canvas) for editing
  const [editingImage, setEditingImage] = useState(importImg);

  return(
    // Passing state to Toolbar and Display
    <div>
      <ToolBar selectedFile={selectedFile}
               setSelectedFile={p=>{setSelectedFile(p)}}
               editingImage = {editingImage}
               setEditingImage={p=>{setEditingImage(p)}}/>
      <div className="row">
        <Editing />
        {selectedFile && <Display selectedFile={selectedFile} setEditingImage={p=>{setEditingImage(p)}} editingImage={editingImage}/>}
      </div>
    </div>
 );
}

export default App;
