from utility import config
from utility.radipop_gui import RadiPopGUI
import numpy as np, json
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import io, base64, sys, os

app = Flask(__name__)
CORS(app)

@app.route('/index', methods=['GET'])
def index():
    return '<html><body><h1>Just Testing</h1><p>This is the index page of my flask server.</p></body></html>'


@app.route('/postPickleGetMask', methods=['POST'])
def postPickleGetMask():
    """! Receive Path to Pickle file and return mask as PNG to client"""
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    arr = RadiPopGUI.read_pickle_mask_to_np_label_array(path=(dictionary['path']))
    img = RadiPopGUI.np_label_array_to_png(arr)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})


@app.route('/postPathToSlices', methods=['POST'])
def postPathToSlices():
    """! Receive Paths to slices, open slices and save them to array"""
    jsdata = request.form['javascript_data']
    data = json.loads(jsdata)
    #data = eval(data)
    RadiPopGUI.pathToSlices = []
    for path in data:
        RadiPopGUI.pathToSlices.append(path)
        RadiPopGUI.sliceCache[os.path.basename(path)] = RadiPopGUI.readPNG(path)
        #print(path,file=sys.stderr)

    return ('OK', 200)


@app.route('/updateMask', methods=['POST'])
def updateMask():
    """! Receive Path to Pickle file and return mask as PNG to client"""
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    liver = int(dictionary['liver-intensity-slider'])
    bone = int(dictionary['bone-intensity-slider'])
    blood = int(dictionary['blood-vessel-intensity-slider'])
    cachedImage = RadiPopGUI.sliceCache[os.path.basename(dictionary['path'])]
    arr = RadiPopGUI.update_mask_upon_slider_change(sk_image=cachedImage,
      bone_intensity=bone,
      blood_vessel_intensity=blood,
      liver_intensity=liver)
    img = RadiPopGUI.np_label_array_to_png(arr)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4041)
