from PIL import Image,ImageDraw
import numpy as np
import pickle
#import imageio
from skimage.measure import label
from . import segmentation_utils
import sys 
class RadiPopGUI: 
    LIVER_LABEL=1
    SPLEEN_LABEL=2
    def __init__(self, patient_id): 
        self.patient_id=patient_id
        self.pathToSlices=[]
        self.sliceCache={}
        self.masks={}
        self.selected_pixel_value_of_label_mask = 0
        self.last_clicked_x = 0
        self.last_clicked_y = 0

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
    def np_label_array_to_png(mask_np_array,highlight=None):
        """! Takes an numpy label array dim(n,m,1) and returns a RGBA pillow image  dim(n,m,4)
        @param mask_np_array numpy label array dim(n,m,1)
        
        @return  RGBA pillow image  dim(n,m,4)
        """
        i=128 # Intensity 
        a=90 # Transparency
        out = np.zeros((mask_np_array.shape[0],mask_np_array.shape[1],4),dtype="uint8")
        out[mask_np_array[:, :] == RadiPopGUI.LIVER_LABEL, :] = [i,0,0,a]
        out[mask_np_array[:, :] == RadiPopGUI.SPLEEN_LABEL, :] = [0,0,i,a]
        out[mask_np_array[:, :] >2, :] = [0,i,0,a]
        out[mask_np_array[:, :] <=0, :] = [0,0,0,0]
        if highlight: 
            i=255
            a=120
            if  highlight==RadiPopGUI.LIVER_LABEL:
                out[mask_np_array[:, :] == RadiPopGUI.LIVER_LABEL, :] = [i,0,0,a]
            elif highlight==RadiPopGUI.SPLEEN_LABEL:
                out[mask_np_array[:, :] == RadiPopGUI.SPLEEN_LABEL, :] = [0,0,i,a]
            else:
                 out[mask_np_array[:, :] == highlight, :] = [0,i,0,a]

        img = Image.fromarray(out, mode="RGBA")
        return img
        #img.save(outfile_prefix+file_base_name+".png", 'PNG')

    @staticmethod
    def update_mask_upon_slider_change(sk_image,bone_intensity,blood_vessel_intensity,liver_intensity):
        """! Sets threshold for liver intensity
        Steps:
            - Sets thresholds for current slice (self.slice_idx)
            - Runs self.find_organs on current slice with new thresholds

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


    def highlightOrgan(self, slice_idx, x,y):
        """! Highlights regions of the mask (organs) that were clicked on by user.
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
                mask= RadiPopGUI.np_label_array_to_png(self.masks[slice_idx],highlight=pixel_value)

            self.selected_pixel_value_of_label_mask = pixel_value
            return mask 

    def labelMask(self, slice_idx, label): 
        if self.selected_pixel_value_of_label_mask !=0:
            self.masks[slice_idx][self.masks[slice_idx]==self.selected_pixel_value_of_label_mask]=label
        return self.masks[slice_idx]
    
    def slice_dim(self):
        """! Returns dimensions of slice images (x,y)"""
        firstItem=next(iter(self.sliceCache.values()))
        return firstItem.shape[1],firstItem.shape[0]
    
    
    def extend_labels(self,cur_idx,left_extend,right_extend):
        """! Extend labels from current slice to neighbouring slices
            Extends labels left and right from current slice
            How far the labels are extended is taken from left and right expansion bounds
        """
        left_most_idx=min(left_extend+1, cur_idx)
        right_most_idx=min(right_extend+1, len(self.sliceCache) - cur_idx)

        #Left of current slice
        for i in range(1, left_most_idx):
            self.masks[cur_idx - i] = segmentation_utils.guess_bounds(self.masks[cur_idx - i], self.masks[cur_idx-i+1])
        
        #Right of current slice 
        for i in range(1, right_most_idx):
            self.masks[cur_idx + i] = segmentation_utils.guess_bounds(self.masks[cur_idx + i], self.masks[cur_idx+i-1])

        left_most_idx=cur_idx-left_most_idx+1
        right_most_idx=cur_idx+right_most_idx-1


        return (left_most_idx,right_most_idx)


    
    @staticmethod
    def draw_on_image(coordinates,img,correctionMode=False):
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
        flat_image= np.array(image)
        flat_image=flat_image.sum(axis=2)
        flat_image[flat_image>0]=1
        new_mask = label(flat_image)
        new_mask[new_mask>0]+=2
        return new_mask


    def save_masks(self,path):
        for id,mask in self.masks.items(): 
            print(id,file=sys.stderr) 
            with open(path+str(id)+".p", 'wb') as file:
                pickle.dump(mask, file)
            
