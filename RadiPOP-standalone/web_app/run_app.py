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
    path=dictionary['path']
    index=int(dictionary["index"])
    arr = RadiPopGUI.read_pickle_mask_to_np_label_array(path)
    patients["#1"].masks[index]=arr
    img = RadiPopGUI.np_label_array_to_png(arr)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})


@app.route('/postPathToSlices', methods=['POST'])
def postPathToSlices():
    """! Receive Paths to slices (!!!MUST BE ORDERED!!! 0,1,..,n ), open slices and save them to array"""
    jsdata = request.form['javascript_data']
    data = json.loads(jsdata)
    #data = eval(data)
    patients["#1"].pathToSlices = []
    for i,path in enumerate(data):
        patients["#1"].pathToSlices.append(path)
        #index=str(os.path.splitext(os.path.basename(path))[0]) #using parse from filename --> avoid ordering prerequirement 
        patients["#1"].sliceCache[i] = RadiPopGUI.readPNG(path)

    return ('OK', 200)


@app.route('/updateMask', methods=['POST'])
def updateMask():
    """! Receive path to corresponding slice and return mask as PNG to client"""
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    liver = int(dictionary['liver-intensity-slider'])
    bone = int(dictionary['bone-intensity-slider'])
    blood = int(dictionary['blood-vessel-intensity-slider'])
    index=int(dictionary['index'])
    cachedImage = patients["#1"].sliceCache[index]
    arr = RadiPopGUI.update_mask_upon_slider_change(sk_image=cachedImage,
      bone_intensity=bone,
      blood_vessel_intensity=blood,
      liver_intensity=liver)
    patients["#1"].masks[index]=arr
    
    img = RadiPopGUI.np_label_array_to_png(arr)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})

@app.route('/highlightOrgan', methods=['POST'])
def highlightOrgan():
    """! Reveive index to correpsonding slice mask --> returns highlighted mask as PNG to client """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    scale_x, scale_y=patients["#1"].slice_dim()
    x= int(scale_x*float(dictionary["x"]))-1
    y= int(scale_y*float(dictionary["y"]))-1
    
    print(str(x)+" "+str(y),file=sys.stderr)

    img=patients["#1"].highlightOrgan(slice_idx=index,x=x,y=y)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})

@app.route('/labelOrgan', methods=['POST'])
def labelOrgan():
    """! Reveive index to correpsonding slice mask and label id --> returns highlighted mask as PNG to client """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    label=int(dictionary["label"])

    arr=patients['#1'].labelMask(slice_idx=index,label=label)
    img = RadiPopGUI.np_label_array_to_png(arr)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})

@app.route('/extendThresholds', methods=['POST'])
def extendThresholds():
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    left=int(dictionary["left"])
    right=int(dictionary["right"])
    left_most_idx,right_most_idx=patients['#1'].extend_labels(cur_idx=index,left_extend=left,right_extend=right)
    data={}
    data["left_most_idx"]=left_most_idx
    data["right_most_idx"]=right_most_idx
    return jsonify(data)

@app.route('/getMask', methods=['POST'])
def getMask():
    """! Reveive index to correpsonding slice mask --> returns mask as PNG to client """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
   
    img=patients["#1"].np_label_array_to_png(patients['#1'].masks[index])
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})


@app.route('/drawOnMask', methods=['POST'])
def drawOnMask():
    """! Reveive index to correpsonding slice mask --> returns mask as PNG to client """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    scale_x, scale_y=patients["#1"].slice_dim()
    for i,cor in enumerate(coordinates):
        if i%2==0:
            coordinates[i]=cor*scale_x
        else: 
            coordinates[i]=cor*scale_y

    img=patients["#1"].np_label_array_to_png(patients['#1'].masks[index])
    RadiPopGUI.draw_on_image(coordinates=coordinates,img=img)
    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})

@app.route('/correctPartition', methods=['POST'])
def correctPartition():
    """! Reveive index to correpsonding slice mask --> returns mask as PNG to client """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    scale_x, scale_y=patients["#1"].slice_dim()
    for i,cor in enumerate(coordinates):
        if i%2==0:
            coordinates[i]=cor*scale_x
        else: 
            coordinates[i]=cor*scale_y
            
    img=patients["#1"].np_label_array_to_png(patients['#1'].masks[index])
    RadiPopGUI.draw_on_image(coordinates=coordinates,img=img,correctionMode=True)
    arr=RadiPopGUI.correct_partition(img)
    patients["#1"].masks[index]=arr
    img=patients["#1"].np_label_array_to_png(arr)

    rawBytes = io.BytesIO()
    img.save(rawBytes, 'PNG')
    rawBytes.seek(0)
    img_base64 = base64.b64encode(rawBytes.read())
    return jsonify({'status': str(img_base64)})

if __name__ == '__main__':
    patients={"#1": RadiPopGUI("#1")}
    app.run(host='0.0.0.0', port=4041)


