from PIL import Image
import numpy as np
import pickle
#import imageio
from skimage.measure import label
from . import segmentation_utils

class RadiPopGUI: 
    pathToSlices=[]
    sliceCache={}

    @staticmethod
    def read_pickle_mask_to_np_label_array(path):
        """! Opens mask pickle file and returns np.array
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
    def np_label_array_to_png(mask_np_array):
        """! Takes an numpy label array dim(n,m,1) and returns a RGBA pillow image  dim(n,m,4)
        @param mask_np_array numpy label array dim(n,m,1)
        
        @return  RGBA pillow image  dim(n,m,4)
        """
        i=128 # Intensity 
        a=90 # Transparency
        out = np.zeros((mask_np_array.shape[0],mask_np_array.shape[1],4),dtype="uint8")
        out[mask_np_array[:, :] == 2, :] = [i,0,0,a]
        out[mask_np_array[:, :] == 1, :] = [0,0,i,a]
        out[mask_np_array[:, :] >2, :] = [0,i,0,a]
        out[mask_np_array[:, :] <=0, :] = [0,0,0,0]
        img = Image.fromarray(out, mode="RGBA")
        return img
        #img.save(outfile_prefix+file_base_name+".png", 'PNG')

    @staticmethod
    def update_mask_upon_slider_change(sk_image,bone_intensity,blood_vessel_intensity,liver_intensity):
        """! Sets threshold for liver intensity
        Steps:
            - Sets thresholds for current slice (self.slice_idx)
            - Runs self.find_organs on current slice with new thresholds
            - Updates self.masks at current slice index

            @param self self
            @param event Unused - kept just in case
        """

        blood_vessels_thresh = [blood_vessel_intensity, 5, 64]
        bones_thresh = [bone_intensity, 2, 64]
        liver_thresh = [liver_intensity, 1, 64]
        mask = RadiPopGUI.find_organs(sk_image, bones_thresh, blood_vessels_thresh, liver_thresh)
        return mask 

    @staticmethod
    def find_organs(sk_image, bones_thresh, blood_vessels_thresh, liver_thresh):
        """! Uses three threshold values to find organs.

        The algorithm is:
            - After some smoothing, remove every pixel above bones threshold from the image.
            - After some smoothing, remove every pixel above blood vessel threshold.
            - Everything that then remains above liver threshold is called an organ.
            - Use contiguous area divisions to roughly split into organs.

            @param sk_image sk_image handle  
            @param bones_thres bones threshold: [threshold, square_size , min_size]
            @param blood_vessels_thresh blood vessels threshold: [threshold, square_size , min_size]
            @param liver_thresh liver threshold: [threshold, square_size , min_size]

            @return New binary mask (same size as slice)
        """
        img = sk_image
        # *bones_thres unfolds to arguments: threshold, square_size , min_size
        mask = segmentation_utils.partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
        imgb = img.copy() * (1 - mask)
        mask = segmentation_utils.partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
        imgb = imgb * (1 - mask)
        liver = segmentation_utils.partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
        liver = segmentation_utils.add_sobel_edges(liver, img)
        mask = label(liver)
        mask[mask>0] = mask[mask>0] + 2
        return mask

    @staticmethod
    def readPNG(path):
        #return imageio.imread(path)
        return np.array(Image.open(path))