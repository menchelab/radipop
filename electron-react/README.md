# RadiPOP: Electron-Flask-React-Components

## Installation

1. Install node.js and npm: https://nodejs.org/en/
2. Install yarn: npm install --global yarn 
3. Install conda: https://docs.conda.io/en/latest/miniconda.html
4. create environment:
```bash
# Create and activate conda environment
conda create --name radipop python=3.7
conda activate radipop
# Install dependencies
conda install pip
pip install -r segmenter_flask_API/requirements.txt
```
4. Install node modules and set up yarn
```bash
npm install
corepack enable
```


## Running the App

**Start app**
- Activate conda environment (or make sure that python packages are available): `conda activate radipop`
- Open App: `npm run electron:start`


## Packaging
**Package the app for the host platform**
conda activate radipop

`npm run electron:package:mac`

`npm run electron:package:windows`

`npm run electron:package:linux`


## Documentation
** Frontend **
- Install JSDoc: `npm install -g jsdoc`
- Create documentation (change directory to Documentation_React): `jsdoc -c jsdoc.conf.json`

** Backend **
- Install Doxygen: `npm install doxygen -g`
- Create documentation (change directory to Documentation_segmenter_flask_API) `doxygen`

## Useful information

 Template adapted from: https://github.com/matbloch/electron-flask.git and <br>
    https://github.com/mmazzarolo/create-react-app-electron-boilerplate<br>
 Adaption: Flask is not serving webpages. It is used for handling function calls via http requests only. Electron spawns the flask server and opens a window with the html frame. The html frame is run in electron browser (chromium). Javascript (react) is used to make http requests (GET and POST) to the flask server. The flask server handles those requests, stores information internally and returns information to the javascript runtime. Data is exchanged in json format. The idea is  to have the flask server run the segmenter commands and return the results to the javascript runtime. REACT components can be incorporated into the html frame.
