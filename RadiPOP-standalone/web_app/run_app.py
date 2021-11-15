# NOTE: Explicitly import configuration so that PyInstaller is able to find and bundle it
import config
import numpy as np
import json
from flask import Flask, jsonify, make_response, render_template, request
from flask_cors import CORS
from config import RadiPopGUI
import os 
app = Flask(__name__)

#Otherwise No 'Access-Control-Allow-Origin' header is present on the requested resource.  --> Cross Origin Resource Sharing 
CORS(app)


@app.route("/index", methods=["GET"])
def index():
    return "<html><body><h1>Just Testing</h1><p>This is the index page of my flask server.</p></body></html>"

'''
@app.route('/slider/<slider_value>', methods=['GET','POST'])
def data_get(slider_value):
    if request.method == 'POST': # POST request
        RadiPopGUI.slider_bone_intensity= int(request.get_text()) # parse as text
        print(RadiPopGUI.slider_bone_intensity)  
        print("test")
        return 'OK', 200
    
    else: # GET request
        message = { }
        message["message"]=str(RadiPopGUI.slider_bone_intensity)
        print(message)
        #return  jsonify(message)
        return str(RadiPopGUI.slider_bone_intensity)

'''
@app.route("/postmethod", methods=["POST"])
def post_javascript_data():
    jsdata = request.form["javascript_data"]
    dictionary=json.loads(jsdata)
    print(dictionary["slider_id"])
    if dictionary["slider_id"]=="bone-intensity-slider":
        RadiPopGUI.slider_bone_intensity=int(dictionary["slider_value"])
    if dictionary["slider_id"]=="liver-intensity-slider":
        RadiPopGUI.slider_liver_intensity=int(dictionary["slider_value"])
    if dictionary["slider_id"]=="blood-vessel-intensity-slider":
        RadiPopGUI.slider_blood_vessel_intensity=int(dictionary["slider_value"])
    return 'OK', 200


@app.route("/getmethod", methods=["GET"])
def get_javascript_data():
    message = {'slider_value': "slider_value: " + str(RadiPopGUI.slider_bone_intensity)+ ", "+ str(RadiPopGUI.slider_blood_vessel_intensity)+ ", "+  str(RadiPopGUI.slider_liver_intensity)}
    print("Got")
    return jsonify(message)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4041)
