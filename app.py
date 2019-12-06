import dash
import dash_core_components as dcc
import dash_html_components as html
import dash_table
from dash.dependencies import Input, Output
import pandas as pd
import glob
import os
import flask
import json
import numpy as np
import plotly.graph_objs as go
from tinydb import TinyDB, Query
from sklearn.decomposition import PCA as sklearnPCA

ASSETS_PATH = os.environ["PH_ASSETS_PATH"] if "PH_ASSETS_PATH" in os.environ else os.path.join(os.getcwd(), "assets/")



external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
server = app.server

masked_images_subdir = "niftynet_masked_images"
unmasked_images_subdir = "raw_images"
patients = [dir  for dir in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir)) if os.path.isdir(
    os.path.join(ASSETS_PATH, masked_images_subdir, dir))]

print(patients)

colors = {
    'background': '#111111',
    'text': '#7FDBFF'
}


app.layout = html.Div(children=[
    html.H1(
        children='Portal Hypertension Project',
        style={
            'textAlign': 'center',
            'color': colors['text']
        },
    ),
    dcc.Dropdown(
        id='image-dropdown',
        #options=[{'label': i, 'value': i} for i in list_of_images],
        #value=list_of_images[0],
        options=[{'label': i, 'value': i} for i in patients],
        value=patients[0],
        style={"margin": "20px"}
    ),

    dcc.Slider(id='my-slider',
               min=0,
               max=250,
               step=1,
               value=100),
    html.Div(id='slider-output-container'),

    html.Div([
        html.Div([
            html.Img(id="masked-image"),
        ],
        style={"margin": "20px"},
        className="four columns"),
        html.Div([
            html.Img(id="unmasked-image"),
        ],
        style={"margin": "20px"},
        className="four columns"),
    ], className="row"),
])


@app.callback(
    dash.dependencies.Output('my-slider', 'max'),
    [dash.dependencies.Input('image-dropdown', 'value')])
def update_slider(value):
    images = [f  for f in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir, value))]
    return len(images) - 1

@app.callback(
    dash.dependencies.Output('masked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('image-dropdown', 'value')])
def update_image_src(idx, patient):
    return '/assets/niftynet_masked_images/' + patient + '/' + str(idx) + ".jpg"

@app.callback(
    dash.dependencies.Output('unmasked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('image-dropdown', 'value')])
def update_image_src(idx, patient):
    return '/assets/niftynet_raw_images/' + patient + '/' + str(idx) + ".jpg"


if __name__ == '__main__':
    app.run_server(debug=True)

