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
import pymysql
from tinydb import TinyDB, Query

ASSETS_PATH = os.environ["RADIPOP_ASSETS_PATH"] if "RADIPOP_ASSETS_PATH" in os.environ else os.path.join(os.getcwd(), "assets/")

def make_connection():
    connection = pymysql.connect(host='localhost',
                                 user='root',
                                 #password='passwd',
                                 db='radipop',
                                 charset='utf8mb4',
                                 cursorclass=pymysql.cursors.DictCursor)
    return connection


external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
server = app.server

masked_images_subdir = "niftynet_masked_images"
unmasked_images_subdir = "raw_images"
composite_images_subdir = "sample_crosssections"
patients = [dir  for dir in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir)) if os.path.isdir(
    os.path.join(ASSETS_PATH, masked_images_subdir, dir))]

df = pd.read_csv(os.path.join(ASSETS_PATH, "patients.csv"), dtype = {'ID': np.object, 'Sex': np.int32, 'Age': np.int32,
                                                                     'pressure': np.int32, 'Name': np.object} )
df.reset_index(inplace=True, drop=True)
#df.set_index(inplace=True, drop=False, keys="ID")
print(df)

patients.sort()

print(patients)

colors = {
    'background': '#111111',
    'text': '#7FDBFF'
}

def update_db(patient_id, update):
    connection = make_connection()
    with connection.cursor() as cursor:
        existing_sql = "select * from radipop.patients where id = %s" % patient_id
        print(existing_sql)
        cursor = connection.cursor()
        cursor.execute(existing_sql)
        existing = cursor.fetchone()

    if existing:
        sql = "update radipop.patients set comment='%s', mask_rev=%d where id = %s" % (
            update["comment"], update["mask_rev"], patient_id)
    else:
        sql = "insert into radipop.patients(id, comment, mask_rev) values (%s, '%s', %s)" % (patient_id, update["comment"], update["mask_rev"])
    with connection.cursor() as cursor:
        cursor.execute(sql)
    connection.commit()
    connection.close()

def query_db(patient_id):
    connection = make_connection()
    existing_sql = "select * from radipop.patients where id = %s" % patient_id
    with connection.cursor() as cursor:
        cursor.execute(existing_sql)
        return cursor.fetchone()
    connection.close()

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
            'overflowY': 'scroll'},
        selected_rows = [0],
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
        dcc.Textarea(
            id="comment-text",
            contentEditable=True,
            placeholder="Comments here",
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
    [dash.dependencies.Input('patients-table', 'selected_rows')])
def update_slider(value):
    patient_id = df.iloc[value[0]]["ID"]
    images = [f  for f in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir, patient_id))]
    return len(images) - 1

@app.callback(
    dash.dependencies.Output('misaligned-checkbox', 'value'),
    [dash.dependencies.Input('patients-table', 'selected_rows')])
def update_checkboxes(value):
    patient_id = df.iloc[value[0]]["ID"]
    stored_record = query_db(str(patient_id))
    print(stored_record)
    check_reverse = False
    if stored_record:
        check_reverse = stored_record["mask_rev"]
    if check_reverse:
        return ["mask-rev"]
    else:
        return []

@app.callback(
    dash.dependencies.Output('comment-text', 'value'),
    [dash.dependencies.Input('patients-table', 'selected_rows')])
def update_comment_value(value):
    patient_id = df.iloc[value[0]]["ID"]
    stored_record = query_db(str(patient_id))
    print("stored record is", stored_record)
    if stored_record:
        return stored_record["comment"]
    return ""

@app.callback(
    dash.dependencies.Output('masked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('misaligned-checkbox', 'value'),
     dash.dependencies.Input('comment-text', 'value'),
     dash.dependencies.Input('patients-table', 'selected_rows')])
def update_image_src(idx, reverse, comment, value):
    if not value:
        return  "/assets/niftynet_masked_images/0/test.jpg"
    patient = str(df.iloc[value[0]]["ID"])
    print(patient)
    update_db(patient, {"mask_rev": "mask-rev" in reverse, "patient_id": patient, "comment": comment})
    if 'mask-rev' in reverse:
        dir = '/assets/niftynet_masked_images_reversed/'
    else:
        idx = len([f  for f in os.listdir(os.path.join(ASSETS_PATH, masked_images_subdir, patient))]) - idx - 1
        dir = '/assets/niftynet_masked_images/'
    return dir + patient + '/' + str(idx) + ".jpg"


@app.callback(
    dash.dependencies.Output('unmasked-image', 'src'),
    [dash.dependencies.Input('my-slider', 'value'),
     dash.dependencies.Input('patients-table', 'selected_rows')])
def update_image_src(idx, value):
    patient = str(df.iloc[value[0]]["ID"])
    return '/assets/niftynet_raw_images/' + patient + '/' + str(idx) + ".jpg"

@app.callback(
    dash.dependencies.Output('composite-image', 'src'),
    [
     dash.dependencies.Input('misaligned-checkbox', 'value'),
     dash.dependencies.Input('patients-table', 'selected_rows')])
def update_image_src(reverse, value):
    patient = str(df.iloc[value[0]]["ID"])
    if 'mask-rev' in reverse:
        return '/assets/sample_crosssections_reversed/' + patient + ".png"
    return '/assets/sample_crosssections/' + patient + ".png"


if __name__ == '__main__':
    app.run_server(debug=True)

