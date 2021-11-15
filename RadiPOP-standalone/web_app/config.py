import os


class BaseConfig:
    SECRET_KEY = os.getenv('SECRET_KEY', 'REPLACE ME')


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    pass

class RadiPopGUI: 
     slider_bone_intensity = 50
     slider_liver_intensity = 50
     slider_blood_vessel_intensity = 50
     def __init__(self):
         pass