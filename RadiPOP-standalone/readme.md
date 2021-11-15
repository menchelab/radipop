# RadiPOP: Electron-Flask-React-Components 
 Template adapted from: https://github.com/matbloch/electron-flask.git <br>
 Adaption: Flask is not serving webpages. It is used for handling function calls via http requests only. Electron spawns the flask server and opens a window with the html frame. The html frame is run in electron browser (chromium). Javascript (jquery) is used to make http requests (GET and POST) to the flask server. The flask server handles those requests, stores information internally and returns information to the javascript runtime. Data is exchanged in json format. The idea would be to have to flask server run the segmenter commands and return the results to the javascript runtime. REACT components can be incorporated into the html frame. 


## Features
- Choose file: Choose a folder containing the png slices. --> Loads them onto screen
- Scrollbar: Mouseover will load slice into main view 
- Hide mask: GET request to flask server: Gets slider values as alert
- Sliders: Will POST slider values to flask server. Flask server stores slider values. 
- Like Button: Demonstration of a React Component

## Dependencies

- [Node.js](https://nodejs.org/en/)
- Python 3

## Installation

Install Python dependencies (inside the package root directory): 

    #Create and activate conda environment 
    conda create --name radipop python=3.7
    conda activate radipop 
    #Install dependencies 
    conda install pip 
    pip install -r requirements.txt

Install node modules (inside the package root directory): 

    npm install

## Running the App

**Start app**
- Activate conda environment (or make sure that python packages are available): `conda activate radipop`
- Recommended: `npm start`
- OR: Windows: `.\node_modules\.bin\electron .`
- OR: Mac OS/Linux: `./node_modules/.bin/electron .`

**Alternatively: Run the app through your web browser**

1. Start Flask server manually: `python web_app/run_app.py`
2. Open in browser:  `web_app/frame/index.html`

## Packaging 
**Package the app for the host platform**
- Activate conda environment (or make sure that python packages are available): `conda activate radipop`
- `npm run package ` (output binaries will be stored in `/dist`)
- The executables can now be run independently of python and npm. 

### Behind the scenes 
Packaging is done in two steps:
1. A standalone Python executable containing the Flask backend is generated using _PyInstaller_
2. The Python executable and the electron application (`electron.js`) are bundled using _electron-builder_

> **NOTE:** The Python executable is generated in the "one-file-mode"; All dependencies are wrapped in a single executable. When executed, the program is decompressed to a temporary directory and run in a **second process** from there. This has to be considered in the life-cycle management of the electron app. See `killPythonSubprocesses` of `electron.js`.



## Encountered Issues
- asar is read-only, .pyc files cannot be created
- When bundling the standalone Python executable in an .asar, a random filename is generated. This makes life-cycle management of the backend service difficult (see also section _Bundling_).

## Useful information 

**Bundling Resources with the Python Executable**

- use `--add-data` to bundle resources with the python executables (use `sys._MEIPASS` to resolve paths)

- see https://github.com/ChrisKnott/Eel/issues/57

```
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)
```

**ASAR Bundling**

- When bundling the electron app in an .asar, the path to the python executable (which is copied to the resource folder) is not resolved properly
