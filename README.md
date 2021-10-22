# radipop
Predicting portal hypertension outcomes from abdominal CT scans


## Installation/dependencies 
    #Create and activate conda environment 
    conda create --name radipop python=3.7
    conda activate radipop 

    #Install dependencies 
    conda install pip 
    pip install -r requirements.txt
    
    
## Usage
To start the graphical user interface: 

    python segmentation.py 
    
The slices (.png) and mask (.p) files must be put in the directories as follows: 

    #Slices (.png files) --> one directory per patient, directory name (PATIENT_ID) must be integer
    assets/niftynet_raw_images/PATIENT_ID/
    
    #Masks (.p files) --> one directory per patient, directory name (PATIENT_ID) must be integer
    assets/masks/PATIENT_ID/
    
        
