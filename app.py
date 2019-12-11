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
from tinydb import TinyDB, Query

ASSETS_PATH = os.environ["RADIPOP_ASSETS_PATH"] if "RADIPOP_ASSETS_PATH" in os.environ else os.path.join(os.getcwd(), "assets/")



external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
server = app.server

masked_images_subdir = "niftynet_masked_images"
unmasked_images_subdir = "raw_images"
composite_images_subdir = "sample_crosssections"
patients = [dir  for dir in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir)) if os.path.isdir(
    os.path.join(ASSETS_PATH, masked_images_subdir, dir))]

df = pd.read_csv(os.path.join(ASSETS_PATH, "patients.csv"))
df.reset_index(inplace=True)
#df.set_index(inplace=True, drop=False, keys="ID")
print(df)

patient_db_path = os.path.join(ASSETS_PATH, "patients.json")
patients_db = TinyDB(patient_db_path, sort_keys=True, indent=4, separators=(',', ': '))

patients.sort()

print(patients)

colors = {
    'background': '#111111',
    'text': '#7FDBFF'
}

def update_db(patient_id, update):
    patients = Query()
    existing = patients_db.search(patients.patient_id == patient_id)
    if existing:
        patients_db.update(update, patients.patient_id == patient_id)
    else:
        patients_db.insert(update)

def query_db(patient_id):
    patients = Query()
    print("patient ID is ", patient_id)
    print(patients_db.search(patients.patient_id == patient_id))
    print(patients_db.all())
    return  patients_db.search(patients.patient_id == patient_id)

app.layout = html.Div(children=[
    html.H1(
        children='Portal Hypertension Project',
        style={
            'textAlign': 'center',
            'color': colors['text']
        },
    ),

    #generate_fancy_table(data_df, patients),
    dash_table.DataTable(
        id='patients-table',
        columns=[{"name": i, "id": i} for i in df.columns],
        data=df.to_dict('records'),
        fixed_rows={ 'headers': True, 'data': 0 },
        filter_action="native",
        sort_action="native",
        sort_mode="multi",
        row_selectable='single',
        style_table={
            'maxHeight': '400px',
            'overflowY': 'scroll'
    },),

    dcc.Dropdown(
        id='image-dropdown',
        #options=[{'label': i, 'value': i} for i in list_of_images],
        #value=list_of_images[0],
        options=[{'label': i, 'value': i} for i in patients],
        value=patients[0],
        style={"margin": "20px"}
    ),

    html.Div([
    dcc.Slider(id='my-slider',
               min=0,
               max=250,
               step=1,
               value=100,
               className="eight columns")
    ], style={"margin": "20px"},  className="row"),
    html.Div(id='slider-output-container'),

    dcc.Checklist(
        id = "misaligned-checkbox",
        options = [
            {'label': 'Mask misaligned', 'value': 'mask-rev'},
            {'label': 'Left and right aren\'t the same', 'value': 'lr-rev'}
        ],
        value = []
    ),

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

    html.H2(children="Some cross-sections"),
    html.Div([
        html.Div([
            html.Img(id="composite-image"),
        ],
        style={"margin": "20px"},
        className="four columns"),
    ], className="row"),


])


@app.callback(
    dash.dependencies.Output('my-slider', 'value'),
    [dash.dependencies.Input('patients-table', 'selected_rows')])
def try_stuff(value):
    print("value is", value)
    if value:
        print(df.iloc[value[0]]["ID"])
    return 100

@app.callback(
    dash.dependencies.Output('my-slider', 'max'),
    [dash.dependencies.Input('image-dropdown', 'value')])
def update_slider(value):
    images = [f  for f in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir, value))]
    return len(images) - 1

@app.callback(
    dash.dependencies.Output('misaligned-checkbox', 'value'),
    [dash.dependencies.Input('patients-table', 'selected_rows')])
def update_checkboxes(value):
        patient_id = df.iloc[value[0]]["ID"]
        stored_record = query_db(str(patient_id))
        print("stored record")
        print(stored_record)
        check_reverse = False
        if len(stored_record) > 0:
            check_reverse = stored_record[0]["mask_rev"]
        if check_reverse:
            print("should be reversed!!")
            return ["mask-rev"]
        else:
            return []

@app.callback(
    dash.dependencies.Output('masked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('misaligned-checkbox', 'value'),
     #dash.dependencies.Input('image-dropdown', 'value')])
     dash.dependencies.Input('patients-table', 'selected_rows')])
def update_image_src(idx, reverse, value):
    if not value:
        return  "/assets/niftynet_masked_images/0/test.jpg"
    patient = str(df.iloc[value[0]]["ID"])
    update_db(patient, {"mask_rev": "mask-rev" in reverse, "patient_id": patient})
    if 'mask-rev' in reverse:
        dir = '/assets/niftynet_masked_images_reversed/'
    else:
        dir = '/assets/niftynet_masked_images/'
    if 'lr-rev' in reverse:
        idx = len([f  for f in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir, patient))]) - idx - 1
    return dir + patient + '/' + str(idx) + ".jpg"


@app.callback(
    dash.dependencies.Output('unmasked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('image-dropdown', 'value')])
def update_image_src(idx, patient):
    return '/assets/niftynet_raw_images/' + patient + '/' + str(idx) + ".jpg"

@app.callback(
    dash.dependencies.Output('composite-image', 'src'),
    [dash.dependencies.Input('image-dropdown', 'value'),
     dash.dependencies.Input('misaligned-checkbox', 'value'),
     ])
def update_image_src(patient, reverse):
    if 'mask-rev' in reverse:
        return '/assets/sample_crosssections_reversed/' + patient + ".png"
    return '/assets/sample_crosssections/' + patient + ".png"



if __name__ == '__main__':
    app.run_server(debug=True)

