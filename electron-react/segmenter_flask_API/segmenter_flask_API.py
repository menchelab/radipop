from tkinter import RADIOBUTTON
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


@app.route('/initialize', methods=['POST'])
def initialize():
    """! Receive Paths to ordered slices, caches slices
    @param patientID The ID of the patient. Must be unique!
    @param paths An array with the paths to the slices 

    @return JSON: {message: message}

    Note: Paths to slices !!!MUST BE ORDERED!!! 0,1,..,n 
    """
    dictionary = request.get_json()
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

    return jsonify({"message": "/initialize: Succesfully initiallized patient with id: " +str(patientID)})



@app.route('/postPickleGetMask', methods=['POST'])
def postPickleGetMask():
    """! Receives path to pickle file --> returns mask as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice the mask refers to
    @param path The path to the mask file 

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    
    """
    dictionary = request.get_json()
    path=dictionary['path']
    index=int(dictionary["index"])
    patientID=dictionary["patientID"]

    arr = RadiPopGUI.read_pickle_mask_to_np_label_array(path)
    patients[patientID].masks[index]=arr
    img = RadiPopGUI.np_label_array_to_png(arr)
    img_base64=RadiPopGUI.create_image_stream(img)
    data={"mask": str(img_base64)}
    data["message"]="/postPickleGetMask: Converted pickle file of slice "+str(index)+" to mask."

    return jsonify(data)





@app.route('/updateMask', methods=['POST'])
def updateMask():
    """! Receives index of slice + slider values --> returns updated mask as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param liver-intensity-slider Slider value for liver intesity 
    @param bone-intensity-slider Slider value for bone intesity 
    @param blood-vessel-intensity-slider Slider value for blood-vessel intesity 

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    """
    dictionary = request.get_json()
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
    data={"mask": str(img_base64)}
    data["message"]="/updateMask: Updated mask of slice "+str(index)
    return jsonify(data)

@app.route('/highlightOrgan', methods=['POST'])
def highlightOrgan():
    """! Reveives index of slice + x,y coordinates --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param x relative x coordinates (0<=x<=1)
    @param y relative y coordinates (0<=y<=1)

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    """
    dictionary = request.get_json()
    index=int(dictionary['index'])
    patientID=dictionary["patientID"]
    scale_x, scale_y=patients[patientID].slice_dim(index)
    x= int(scale_x*float(dictionary["x"]))-1
    y= int(scale_y*float(dictionary["y"]))-1
    
    print(str(x)+" "+str(y),file=sys.stderr)

    img=patients[patientID].highlightOrgan(slice_idx=index,x=x,y=y)
    img_base64=RadiPopGUI.create_image_stream(img)

    data={"mask": str(img_base64)}
    data["message"]="/highlightOrgan: Highligted organ on slice " +str(index)
    return jsonify(data)

@app.route('/labelOrgan', methods=['POST'])
def labelOrgan():
    """! Reveives index to slice mask + label id --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param label Label of organ (1 for liver, 2 for spleen, 0 nothing, >2 other organ)

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    
    """
    dictionary = request.get_json()
    print(dictionary,file=sys.stderr)
    index=int(dictionary['index'])
    label=int(dictionary["label"])
    patientID=dictionary["patientID"]
    arr=patients[patientID].labelMask(slice_idx=index,label=label)
    img = RadiPopGUI.np_label_array_to_png(arr)
    img_base64=RadiPopGUI.create_image_stream(img)

    data={"mask": str(img_base64)}
    data["message"]="/labelOrgan: Labelled organ on slice " +str(index)
    return jsonify(data)

@app.route('/extendLabels', methods=['POST'])
def extendLabels():
    """! Reveives index to slice mask + label id --> returns highlighted mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param left Extend labeling up to index-left
    @param right Extend labeling up to index+right

    @returns JSON: {left_most_idx: idx, right_most_idx: idx} 

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

    dictionary = request.get_json()
    index=int(dictionary['index'])
    left=int(dictionary["left"])
    right=int(dictionary["right"])
    patientID=dictionary["patientID"]
    left_most_idx,right_most_idx=patients[patientID].extend_labels(cur_idx=index,left_extend=left,right_extend=right)
    data={}
    data["left_most_idx"]=left_most_idx
    data["right_most_idx"]=right_most_idx
    data["message"]="/extendLabels: Extended labels for slices " + str(left_most_idx) + " to " + str(right_most_idx)
    return jsonify(data)

@app.route('/getMask', methods=['POST'])
def getMask():
    """! Reveives index to slice/mask --> returns mask stored on flask server as PNG to client
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    
    """
    dictionary = request.get_json()
    index=int(dictionary['index'])
    patientID=dictionary["patientID"]

    img=patients[patientID].np_label_array_to_png(patients[patientID].masks[index])
    img_base64=RadiPopGUI.create_image_stream(img)
    data={"mask": str(img_base64)}
    data["message"]="/getMask: Got mask for slice " +str(index)
    return jsonify(data)


@app.route('/drawOnMask', methods=['POST'])
def drawOnMask():
    """! Reveives index to slice/mask + x,y coordinates --> returns drawn on mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param coordinates array of coordinates of the form [x0,y0,x1,y1,...,xn,yn]

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Note: The coordinates array will be used to draw a line on the mask. 

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    """
    dictionary = request.get_json()
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    patientID=dictionary["patientID"]

    scale_x, scale_y=patients[patientID].slice_dim(index)
    for i,cor in enumerate(coordinates):
        if i%2==0:
            coordinates[i]=cor*scale_x
        else: 
            coordinates[i]=cor*scale_y

    img=patients[patientID].np_label_array_to_png(patients[patientID].masks[index])
    RadiPopGUI.draw_on_image(coordinates=coordinates,img=img)
    img_base64=RadiPopGUI.create_image_stream(img)
    data={"mask": str(img_base64)}
    data["message"]="/drawOnMask: Lines drawn on mask of slice " +str(index)
    return jsonify(data)

@app.route('/correctPartition', methods=['POST'])
def correctPartition():
    """! Reveives index to slice/mask + coordinates--> returns partion corrected mask as PNG to client 
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 
    @param coordinates array of coordinates of the form [x0,y0,x1,y1,...,xn,yn]

    @return JSON: {mask: byte stream} mask as transparent PNG as byte stream 

    Note: The coordinates array will be used to generate a line that cuts/divides the segmented organs.

    Example handling of return image stream in js: 

        fetch(RadiPOP_states.FLASK_SERVER+"/labelOrgan", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(function(response){ return response.json();})   
        .then(function(data){                      
        bytestring = data["mask"];
        img = bytestring.split('\'')[1]
    """
    dictionary = request.get_json()
    index=int(dictionary['index'])
    coordinates=dictionary["coordinates"]
    patientID=dictionary["patientID"]

    scale_x, scale_y=patients[patientID].slice_dim(index)
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
    data={"mask": str(img_base64)}
    data["message"]="/correctPartition: Corrections for mask of slice " +str(index) + " were accepted."
    return jsonify(data)

@app.route('/saveMasks', methods=['POST'])
def saveMasks():
    """! Reveives path, saves all stored masks as pickle files to path --> returns output path
    @param patientID The ID of the patient
    @param index The index of the slice for which to mask should be updated 

    @return JSON: {outdir: path}  path/directory to which the pickle files were written  
    """
    dictionary = request.get_json()
    outPath=dictionary['path']
    patientID=dictionary["patientID"]
    print(outPath,file=sys.stderr)
    patients[patientID].save_masks(path=outPath)
    data ={"outdir": outPath}
    data["message"]="/saveMasks: Saved mask files. Output written to: " + outPath
    return jsonify(data)


@app.route('/dcm2png', methods=['POST'])
def dcm2png():
    """! Receive Paths to dcm files, converts them to PNG

    Included metadata IDs: "PatientID","PatientBirthDate","PatientName",
    "PatientAge","PatientSex","PatientName","SliceThickness","StudyID","ContentDate"
    
    @param paths An array with the paths to the slices 
    @param low_clip: lowest pixel value (Recommended:850)
    @param high_clip: highest pixel value (Recommended: 1250)

    @return JSON: {message: message, metadata: dictionary}
    """
    dictionary = request.get_json()
    paths=dictionary["paths"]
    low_clip=dictionary["low_clip"]
    high_clip=dictionary["high_clip"]

    slices=[]
    indices=[]
    for path in paths:
        img,index = RadiPopGUI.clip_dcm(dcm_file=path,clip_low=low_clip,clip_high=high_clip)
        slices.append(img)
        indices.append(index)
    
    for i,j in enumerate(np.argsort(indices)): 
        #print(indices[j],file=sys.stderr)
        outfile=os.path.dirname(path)+"/"+str(i)+".png"
        RadiPopGUI.writePillow2PNG(img=slices[j],outfile=outfile)
        
    data={}
    data["message"]="/dcm2png: Converted dicom files. Output written to: " +os.path.dirname(paths[0])
    data["metadata"]= RadiPopGUI.extract_metadata_from_dcm(dcm_file=paths[0])
    return jsonify(data)

@app.route('/dcm2pngPreview', methods=['POST'])
def dcm2pngPreview():
    """! Receive Paths to dcm file, converts it to PNG

    Included metadata IDs: "PatientID","PatientBirthDate","PatientName",
    "PatientAge","PatientSex","PatientName","SliceThickness","StudyID","ContentDate"
    
    @param path The paths to the dcm file
    @param low_clip: lowest pixel value (Recommended:850)
    @param high_clip: highest pixel value (Recommended: 1250)

    @return JSON: {slice: slice stream} slice as PNG as byte stream
    """
    dictionary = request.get_json()
    path=dictionary["path"]
    low_clip=dictionary["low_clip"]
    high_clip=dictionary["high_clip"]

    
    img,index = RadiPopGUI.clip_dcm(dcm_file=path,clip_low=low_clip,clip_high=high_clip)
    img_base64 = RadiPopGUI.create_image_stream(img)

    data={}
    data={"slice": str(img_base64)} 
    data["message"]="/dcm2pngPreview: Created preview for dicom file with slice " +str(index)
    data["metadata"]= RadiPopGUI.extract_metadata_from_dcm(dcm_file=path)
    return jsonify(data)
if __name__ == '__main__':

    ## Dictionary which will hold for each patientID a RadiPopGUI object.
    ## Patients are added by the API's /initialize function 
    patients={}
    app.run(host=FLAST_HOST, port=FLASK_PORT)


