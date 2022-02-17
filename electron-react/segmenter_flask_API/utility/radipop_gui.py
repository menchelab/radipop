from PIL import Image,ImageDraw
import numpy as np
import pickle
#import imageio
import pydicom
from skimage.measure import label
from . import segmentation_utils
import sys, io, base64
class RadiPopGUI: 
    """! Bridge between the flask server/API and the RadiPOP segmenter:
    
    Note: 
        - For each patient one object of this class should be instantiated.
        - An object of this class contains all the slices and masks associated with the patient 
        - This class also contains static utility functions
        - This class is the bridge between the flask server/API and the RadiPOP segmenter (segmentations_utils)
    """
    ## Regions in mask with this label value are considered liver 
    LIVER_LABEL=1
    ## Regions in mask with this label value are considered spleen 
    SPLEEN_LABEL=2
    ## list with labels
    LABELS=[SPLEEN_LABEL,SPLEEN_LABEL]

    def __init__(self, patient_id): 
        """! Class constructor: 
        @param patient_id The ID of the patient. Must be unique!
        
        Note: 
            - For each patient one object of this class should be instantiated.
            - An object of this class contains all the slices and masks associated with the patient 
        """
        ## ID of the patient 
        self.patient_id=patient_id
        ## List contaning the path to the png slice files  
        self.pathToSlices=[]
        ## Dictionary: key: slice index, value: slice PNG 
        self.sliceCache={}
        ## Dictionary: key: mask index, value: mask numpy array dim(n,m,1)
        self.masks={}
        ## The label of the region that was last selected/clicked on 
        self.selected_pixel_value_of_label_mask = 0
        ## The x-coordinate of the region that was last selected/clicked on 
        self.last_clicked_x = 0
        ## The y-coordinate of the region that was last selected/clicked on 
        self.last_clicked_y = 0

    @staticmethod
    def read_pickle_mask_to_np_label_array(path):
        """! Opens mask pickle file and returns it as a np.array
        @param path Path to pickle file
        @return numpy array of mask 
        """
        objects = []
        with (open(path, "rb")) as openfile:
            while True:
                try:
                    objects.append(pickle.load(openfile))
                except EOFError:
                    break
        return objects[0]

    @staticmethod
    def color_mask(mask_np_array):
        """! Takes an numpy label array dim(n,m,1) and returns a color mask  dim(n,m,4)
        @param mask_np_array numpy label array dim(n,m,1)
        @return  color mask image  dim(n,m,4) --> RGBA

            - Default liver color is red (LIVER_LABEL)
            - Default spleen color is blue (SPLEEN_LABEL)
            - Default for other regions is green 
        """
        i=128 # Intensity 
        t=90 # Transparency
        out = np.zeros((mask_np_array.shape[0],mask_np_array.shape[1],4),dtype="uint8")
        out[mask_np_array[:, :] == RadiPopGUI.LIVER_LABEL, :] = [i,0,0,t]
        out[mask_np_array[:, :] == RadiPopGUI.SPLEEN_LABEL, :] = [0,0,i,t]
        out[mask_np_array[:, :] >2, :] = [0,i,0,t]
        out[mask_np_array[:, :] <=0, :] = [0,0,0,0]
        return out

    @staticmethod
    def np_label_array_to_png(mask_np_array):
        """! Takes an numpy label array dim(n,m,1) and returns a RGBA pillow image  dim(n,m,4)
        @param mask_np_array numpy label array dim(n,m,1)
        @highlight Highlight regions where highlight==label in brighter color  
        @return  RGBA pillow image  dim(n,m,4)

        Turns a labelled mask into a transparent (RGBA) PNG. 
            - Default liver color is red (LIVER_LABEL)
            - Default spleen color is blue (SPLEEN_LABEL)
            - Default for other regions is green 
        """
        colored_mask = RadiPopGUI.color_mask(mask_np_array)
        img = Image.fromarray(colored_mask, mode="RGBA")
        return img

    def highlight_np_label_array_to_png(self,mask_np_array,highlight):
        """! Takes an numpy label array dim(n,m,1) and returns a RGBA pillow image  dim(n,m,4)
        @param mask_np_array numpy label array dim(n,m,1)
        @highlight Highlight regions where highlight==label in brighter color  
        @return  RGBA pillow image  dim(n,m,4)

        Turns a labelled mask into a transparent (RGBA) PNG. 
            - Default liver color is red (LIVER_LABEL)
            - Default spleen color is blue (SPLEEN_LABEL)
            - Default for other regions is green 
        """
        colored_mask = RadiPopGUI.color_mask(mask_np_array)
         
        # In order to highligh disconected regions of organs separately 
        unlabelled_mask= label(mask_np_array)
        unlabelled_mask[unlabelled_mask>0]+=max(RadiPopGUI.LABELS)
        surrogate_label=unlabelled_mask[self.last_clicked_y,self.last_clicked_x]
        
        i=255 # intensity
        t=120 # transparency
        if  highlight==RadiPopGUI.LIVER_LABEL:
            colored_mask[np.logical_and(mask_np_array[:, :] == RadiPopGUI.LIVER_LABEL,unlabelled_mask[:, :] == surrogate_label), :] = [i,0,0,t]
        elif highlight==RadiPopGUI.SPLEEN_LABEL:
            colored_mask[np.logical_and(mask_np_array[:, :] == RadiPopGUI.SPLEEN_LABEL,unlabelled_mask[:, :] == surrogate_label), :] = [0,0,i,t]
        else:
            colored_mask[mask_np_array[:, :] == highlight, :] = [0,i,0,t]

        img = Image.fromarray(colored_mask, mode="RGBA")
        return img

    @staticmethod
    def update_mask_upon_slider_change(image,bone_intensity,blood_vessel_intensity,liver_intensity):
        """! Sets threshold for liver intensity
        @param image Image (e.g.: RGBA PNG pillow)
        @param bones_thresh bones threshold
        @param blood_vessels_thresh blood vessels threshold
        @param liver_thresh liver threshold
        @return New labelled mask

        Steps:
            - Sets thresholds for current slice 
            - Runs self.find_organs on current slice with new thresholds

        """

        blood_vessels_thresh = [blood_vessel_intensity, 5, 64]
        bones_thresh = [bone_intensity, 2, 64]
        liver_thresh = [liver_intensity, 1, 64]
        mask = RadiPopGUI.find_organs(image, bones_thresh, blood_vessels_thresh, liver_thresh)
        return mask 

    @staticmethod
    def find_organs(img, bones_thresh, blood_vessels_thresh, liver_thresh):
        """! Uses three threshold values to find organs.
        @param image Image (e.g.: RGBA PNG pillow)   
        @param bones_thresh bones threshold: [threshold, square_size , min_size]
        @param blood_vessels_thresh blood vessels threshold: [threshold, square_size , min_size]
        @param liver_thresh liver threshold: [threshold, square_size , min_size]

        @return New labelled mask (same size as slice)


        The algorithm is:
            - After some smoothing, remove every pixel above bones threshold from the image.
            - After some smoothing, remove every pixel above blood vessel threshold.
            - Everything that then remains above liver threshold is called an organ.
            - Use contiguous area divisions to roughly split into organs.

        """
        # *bones_thres unfolds to arguments: threshold, square_size , min_size
        mask = segmentation_utils.partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
        imgb = img.copy() * (1 - mask)
        mask = segmentation_utils.partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
        imgb = imgb * (1 - mask)
        liver = segmentation_utils.partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
        liver = segmentation_utils.add_sobel_edges(liver, img)
        mask = label(liver)
        mask[mask>0] = mask[mask>0] + max(RadiPopGUI.LABELS)
        return mask

    @staticmethod
    def readPNG(path):
        """! Reads an image (e.g.: PNG file) to numpy array
        @param path Path to image
        @return numpy array of image
        """
        #return imageio.imread(path)
        return np.array(Image.open(path))


    def highlightOrgan(self, slice_idx, x,y):
        """! Highlights regions of the mask (organs) that were clicked on by user.
        @param slice_idx Index of mask/slice to be highlighted 
        @param x x-coordinate of slice (in pixels)
        @param y y-coordinate of slice (in pixels)
        @return tuple(Mask where the region specified by x and y is highlighted in brigther colors, pixel_value)
        """
        if x < self.masks[slice_idx].shape[1] and y < self.masks[slice_idx].shape[0]:
            self.last_clicked_x = x
            self.last_clicked_y = y
            pixel_value = self.masks[slice_idx][y, x]
            if pixel_value == 0: # Unhighlight selection
                print("Unhighlighted area",file=sys.stderr)
                mask= RadiPopGUI.np_label_array_to_png(self.masks[slice_idx])
            else:
                print("Highlighted area",file=sys.stderr)
                print(pixel_value,file=sys.stderr)
                mask= self.highlight_np_label_array_to_png(self.masks[slice_idx],highlight=pixel_value)

            self.selected_pixel_value_of_label_mask = pixel_value
            return mask,pixel_value

    def labelMask(self, slice_idx, newlabel): 
        """! Labels mask at given index at previously selected region
        @param slice_idx Index of mask/slice to be labelled
        @param label Label to be assigned to previously selected region (either LIVER_LABEL or SPLEEN_LABEL or -1 (for removeing label))
        @return Mask with new label 

        Note: It is expected that the client has before highlighted an organ with the function self.highlightOrgan(). 
        This determines the region/organ that will be labelled with label. 
        """
        #Remove label 
        if (newlabel==-1): 
            newlabel=np.max(self.masks[slice_idx])+1
            print(newlabel,file=sys.stderr)
        
        # In order to highligh disconected regions of organs separately 
        unlabelled_mask= label(self.masks[slice_idx])
        unlabelled_mask[unlabelled_mask>0]+=max(RadiPopGUI.LABELS)
        surrogate_label=unlabelled_mask[self.last_clicked_y,self.last_clicked_x]

        if self.selected_pixel_value_of_label_mask !=0:
            self.masks[slice_idx][np.logical_and(self.masks[slice_idx]==self.selected_pixel_value_of_label_mask,unlabelled_mask == surrogate_label)]=newlabel
        return self.masks[slice_idx]
    
    def slice_dim(self, index):
        """! Returns dimensions of slice images (x,y)
        @return (x,y) Dimensions of slices 
        """
        return self.sliceCache[index].shape[1],self.sliceCache[index].shape[0]
    
    
    def extend_labels(self,cur_idx,left_extend,right_extend):
        """! Extend labels from current slice to neighbouring slices
        @param cur_idx Index of reference slice 
        @param left_extend Number of slices to extend the labeling to below reference slice 
        @param right_extend Number of slices to extend the labeling to above reference slice

        @return (left_most_idx,right_most_idx) The index of the outermost slices to which the labeling was extended

        Extends labels left and right from current slice
        How far the labels are extended is taken from left and right expansion bounds
        """
        down= cur_idx if (cur_idx-left_extend<0) else left_extend
        up= len(self.sliceCache)-cur_idx-1 if (cur_idx+right_extend>=len(self.sliceCache)) else right_extend

        #Left of current slice
        for i in range(0, down):
            self.masks[cur_idx - i-1] = segmentation_utils.guess_bounds(self.masks[cur_idx - i-1], self.masks[cur_idx-i])
        
        #Right of current slice 
        for i in range(0, up):
            self.masks[cur_idx + i+1] = segmentation_utils.guess_bounds(self.masks[cur_idx + i+1], self.masks[cur_idx+i])

        left_most_idx=cur_idx-down
        right_most_idx=cur_idx+up


        return (left_most_idx,right_most_idx)


    
    @staticmethod
    def draw_on_image(coordinates,img,correctionMode=False):
        """! Draws a point or lines on given PNG image
        @param coordinates List of the form [x0,y0,x1,y1,...,xn,yn]
        @param img Image (e.g.: RGBA PNG pillow)
        @param correctionMode True/False If true the drawn line acts as an eraser (dividing organs).
        If false a colored line is drawn on the image. DEFAULT: False
        
        The modifications are made directly on the provided image. No return value 
        """
        assert(len(coordinates)%2==0)
        draw = ImageDraw.Draw(img)  
        if correctionMode:
            color=(0,0,0,0)
            wd=2
        else:
            color=(230, 100, 150, 255)   
            wd=2

        if len(coordinates)/2==1:
            radius=2
            draw.ellipse([
                coordinates[0]-radius,coordinates[1]-radius,
                coordinates[0]+radius,coordinates[1]+radius],
                 fill=color)
        else: 
            draw.line(coordinates, fill=color,width=wd)

    @staticmethod
    def correct_partition(image):
        """! Convert PNG mask to 1 channelled label mask
        @param image Image (e.g.: RGBA PNG pillow)
        @return label mask 
        """
        flat_image= np.array(image)
        #Sum RGBA channels to obtain 1 channel image 
        flat_image=flat_image.sum(axis=2)
        flat_image[flat_image>0]=1
        new_mask = label(flat_image)
        new_mask[new_mask>0]+=max(RadiPopGUI.LABELS)
        return new_mask


    def save_masks(self,path):
        """!Saves masks as pickle file to given path 
        @param path Path to which mask files should be written 

        Masks are written as .p (pickle) files 
        """
        for id,mask in self.masks.items(): 
            print(id,file=sys.stderr) 
            with open(path+str(id)+".p", 'wb') as file:
                pickle.dump(mask, file)
            
    @staticmethod
    def create_image_stream(img):
        """! Returns base64 bytestream for given input image
        @param img Image (e.g. Pillow PNG)
        @return img_base64 stream
        """
        rawBytes = io.BytesIO()
        img.save(rawBytes, 'PNG')
        rawBytes.seek(0)
        img_base64 = base64.b64encode(rawBytes.read())
        return img_base64

    
    @staticmethod
    def clip_dcm(dcm_file,clip_low=850,clip_high=1250):
        """!Read dicom image (.dcm), clips it and returns it as a grey scale PNG
        
        @param dcm_file Path to .dcm file
        @param clip_low lowest pixel value
        @param clip_high highest pixel value
        
        @return tuple(L (grey scale) Pillow Image, slice index)
        
        """
        dataset=pydicom.dcmread(dcm_file)
        temp=dataset.pixel_array.copy()
        temp[temp<clip_low]=clip_low
        temp[temp>clip_high]=clip_high
        temp= temp-clip_low
        temp= temp/temp.max()*255
        temp=temp.astype(np.uint8)
        img = Image.fromarray(temp)
        return img, int(dataset.InstanceNumber)

    @staticmethod
    def extract_metadata_from_dcm(dcm_file):
        """!Read dicom image (.dcm) and extract metadata
        Extracted metadata IDs: "PatientID","PatientBirthDate","PatientName",
        "PatientAge","PatientSex","PatientName","SliceThickness","StudyID","ContentDate"
        @param dcm_file Path to .dcm file
        
        @return dictionary with metadata information 
        """

        dataset=pydicom.dcmread(dcm_file)
        metadataIDs=["PatientID","PatientBirthDate","PatientName","PatientAge","PatientSex","PatientName","SliceThickness","StudyID","ContentDate"]
        metadata={}
        for ID in metadataIDs:
            try:
                metadata[ID]=str(dataset[ID].value)
            except:
                metadata[ID]="NA"
        return metadata

    @staticmethod
    def writePillow2PNG(img,outfile):
        img.save(outfile)