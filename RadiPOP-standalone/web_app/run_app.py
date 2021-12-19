from utility import config
from utility.radipop_gui import RadiPopGUI
import numpy as np, json
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sys, os

app = Flask(__name__)
CORS(app)

FLASK_PORT=4041
FLAST_HOST='0.0.0.0'

@app.route('/postPickleGetMask', methods=['POST'])
def postPickleGetMask():
    """! Receives path to pickle file --> returns mask as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice the mask refers to
    @param path The path to the mask file 

    @return mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    path=dictionary['path']
    index=int(dictionary["index"])
    patientID=dictionary["patientID"]

    arr = RadiPopGUI.read_pickle_mask_to_np_label_array(path)
    patients[patientID].masks[index]=arr
    img = RadiPopGUI.np_label_array_to_png(arr)
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})


@app.route('/initialize', methods=['POST'])
def initialize():
    """! Receive Paths to ordered slices, caches slices
    @param patientID The ID of the patient. Must be unique!
    @param paths An array with the paths to the slices 

    @return 200,OK

    Note: Paths to slices !!!MUST BE ORDERED!!! 0,1,..,n 
    """

    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    paths=dictionary["paths"]
    patientID=dictionary["patientID"]

    print("Initialized with patientID:"+ str(patientID), file=sys.stderr)

    patients[patientID] = RadiPopGUI(patient_id=patientID)
    patients[patientID].pathToSlices = []
    for i,path in enumerate(paths):
        patients[patientID].pathToSlices.append(path)
        #index=str(os.path.splitext(os.path.basename(path))[0]) #using parse from filename --> avoid ordering prerequirement 
        patients[patientID].sliceCache[i] = RadiPopGUI.readPNG(path)
        #patients[patientID].masks[i] = None

    return ('OK', 200)


@app.route('/updateMask', methods=['POST'])
def updateMask():
    """! Receives index of slice + slider values --> returns updated mask as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param liver-intensity-slider Slider value for liver intesity 
    @param bone-intensity-slider Slider value for bone intesity 
    @param blood-vessel-intensity-slider Slider value for blood-vessel intesity 

    @return mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    liver = int(dictionary['liver-intensity-slider'])
    bone = int(dictionary['bone-intensity-slider'])
    blood = int(dictionary['blood-vessel-intensity-slider'])
    index=int(dictionary['index'])
    patientID=dictionary["patientID"]

    cachedImage = patients[patientID].sliceCache[index]
    arr = RadiPopGUI.update_mask_upon_slider_change(image=cachedImage,
      bone_intensity=bone,
      blood_vessel_intensity=blood,
      liver_intensity=liver)
    patients[patientID].masks[index]=arr
    
    img = RadiPopGUI.np_label_array_to_png(arr)
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})

@app.route('/highlightOrgan', methods=['POST'])
def highlightOrgan():
    """! Reveives index of slice + x,y coordinates --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param x relative x coordinates (0<=x<=1)
    @param y relative y coordinates (0<=y<=1)

    @return mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    patientID=dictionary["patientID"]
    scale_x, scale_y=patients[patientID].slice_dim()
    x= int(scale_x*float(dictionary["x"]))-1
    y= int(scale_y*float(dictionary["y"]))-1
    
    print(str(x)+" "+str(y),file=sys.stderr)

    img=patients[patientID].highlightOrgan(slice_idx=index,x=x,y=y)
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})

@app.route('/labelOrgan', methods=['POST'])
def labelOrgan():
    """! Reveives index to slice mask + label id --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param label Label of organ (1 for liver, 2 for spleen, 0 nothing, >2 other organ)

    @return mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    label=int(dictionary["label"])
    patientID=dictionary["patientID"]
    arr=patients[patientID].labelMask(slice_idx=index,label=label)
    img = RadiPopGUI.np_label_array_to_png(arr)
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})

@app.route('/extendThresholds', methods=['POST'])
def extendThresholds():
    """! Reveives index to slice mask + label id --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param left Extend labeling up to index-label
    @param right Extend labeling up to index+label

    @returns json data containing left_most_idx and right_most_idx 

    Note: The left_most_idx and right_most_idx correspond to 
    the indices of the slices up to which the labeling has been 
    extended. After the the function has finished use the function
    API's function /getMask to update the masks in your GUI. Example in js: 

        for (let index=parseInt(data["left_most_idx"]); index<parseInt(data["right_most_idx"])+1; index++) {     
            $.post(FLASK_SERVER+"/getMask", {
                javascript_data: JSON.stringify({patienID: id, index: idx})
            })
        }
    
    """

    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    left=int(dictionary["left"])
    right=int(dictionary["right"])
    patientID=dictionary["patientID"]
    left_most_idx,right_most_idx=patients[patientID].extend_labels(cur_idx=index,left_extend=left,right_extend=right)
    data={}
    data["left_most_idx"]=left_most_idx
    data["right_most_idx"]=right_most_idx
    return jsonify(data)

@app.route('/getMask', methods=['POST'])
def getMask():
    """! Reveives index to slice/mask --> returns mask stored on flask server as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 

    @return mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    patientID=dictionary["patientID"]

    img=patients[patientID].np_label_array_to_png(patients[patientID].masks[index])
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})


@app.route('/drawOnMask', methods=['POST'])
def drawOnMask():
    """! Reveives index to slice/mask + x,y coordinates --> returns drawn on mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param coordinates array of coordinates of the form [x0,y0,x1,y1,...,xn,yn]

    @return mask as transparent PNG as byte stream 

    Note: The coordinates array will be used to draw a line on the mask. 

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    patientID=dictionary["patientID"]

    scale_x, scale_y=patients[patientID].slice_dim()
    for i,cor in enumerate(coordinates):
        if i%2==0:
            coordinates[i]=cor*scale_x
        else: 
            coordinates[i]=cor*scale_y

    img=patients[patientID].np_label_array_to_png(patients[patientID].masks[index])
    RadiPopGUI.draw_on_image(coordinates=coordinates,img=img)
    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})

@app.route('/correctPartition', methods=['POST'])
def correctPartition():
    """! Reveives index to slice/mask + coordinates--> returns partion corrected mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param coordinates array of coordinates of the form [x0,y0,x1,y1,...,xn,yn]

    @return mask as transparent PNG as byte stream 

    Note: The coordinates array will be used to generate a line that cuts/divides the segmented organs.

    Example handling of return image stream in js: 

        bytestring = data['status']
        img = bytestring.split('\'')[1]  
        target.src ="data:image/png;base64," + img; 
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    patientID=dictionary["patientID"]

    scale_x, scale_y=patients[patientID].slice_dim()
    for i,cor in enumerate(coordinates):
        if i%2==0:
            coordinates[i]=cor*scale_x
        else: 
            coordinates[i]=cor*scale_y
            
    img=patients[patientID].np_label_array_to_png(patients[patientID].masks[index])
    RadiPopGUI.draw_on_image(coordinates=coordinates,img=img,correctionMode=True)
    arr=RadiPopGUI.correct_partition(img)
    patients[patientID].masks[index]=arr
    img=patients[patientID].np_label_array_to_png(arr)

    img_base64=RadiPopGUI.create_image_stream(img)
    return jsonify({'status': str(img_base64)})

@app.route('/saveMasks', methods=['POST'])
def saveMasks():
    """! Reveives path, saves all stored masks as pickle files to path --> returns output path
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 

    @return path/directory to which the pickle files were written  
    """
    jsdata = request.form['javascript_data']
    dictionary = json.loads(jsdata)
    outPath=dictionary['path']
    patientID=dictionary["patientID"]
    print(outPath,file=sys.stderr)
    patients[patientID].save_masks(path=outPath)
    data ={"outdir": outPath}
    return jsonify(data)

if __name__ == '__main__':

    ## Dictionary which will hold for each patientID a RadiPopGUI object.
    ## Patients are added by the API's /initialize function 
    patients={}
    app.run(host=FLAST_HOST, port=FLASK_PORT)


