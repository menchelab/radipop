import './styles/App.css';
import './styles/index.css';
import ToolBar from './components/toolbar/Toolbar.js';
import Editing from './components/editing/Editing.js';
import Display from './components/display/Display.js';

function App() {
  return(
    <div>
      <ToolBar/>
      <div className="row">
        <Editing/>
        <Display/>
      </div>
    </div>
 );
}

export default App;
