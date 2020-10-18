from PIL import Image
from scipy import ndimage as ndi
from scipy import ndimage as ndi
from scipy.ndimage.interpolation import shift
from skimage import data, morphology
from skimage import data, morphology, feature, filters
from skimage import io as skio
from skimage.color import label2rgb
from skimage.exposure import histogram
from skimage.feature import peak_local_max
from skimage.filters import sobel, roberts, prewitt, threshold_otsu
from skimage.future import graph
from skimage.measure import label, regionprops
from skimage.morphology import closing, opening, square, remove_small_holes, remove_small_objects
from skimage.segmentation import clear_border
import dicom2nifti
import io as jio
import matplotlib.gridspec as gridspec
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import os
import pydicom
import sys
import pickle

def create_images_for_display(name, input_dir=None, output_dir=None):
    '''
    Convert images from DICOM to png.
    '''
    if input_dir == None:
        input_dir = "data/ct_dicom/"
    path = input_dir  + name

    if output_dir == None:
        output_dir = "assets/niftynet_raw_images"
    try:
        os.mkdir_p(os.path.join(output_dir, name))
    except:
        print("Patient %s failed" % name)
        pass
    files = [pydicom.dcmread(os.path.join(path, f)) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
    if not files:
        print("no files found at ", os.path.join(path, f))
        return
    patient_position = files[0].PatientPosition
    # Patient scans are either "feet first" (FFS) or "head first" (HFS). If FFS, they must be reversed.
    reverse = patient_position == "FFS"
    files.sort(key=lambda x: float(x.SliceLocation), reverse=reverse)


    organs = get_longest_frame_interval(name)
    files = files[organs[0]:organs[1]]

    num_slides = len(files)

    max_frame = [10000, 10000, 0, 0]
    for i, file in enumerate(files):
        orig = extract_pixels_for_viewing(file)
        orig, frame = trim_background(orig)
        l1, l2, u1, u2 = frame
        max_frame[:2] = min(max_frame[:2], frame[:2])
        max_frame[2:] = max(max_frame[2:], frame[2:])


    for i, file in enumerate(files):

        ext = i + organs[0]
        orig = extract_pixels_for_viewing(file)
        aim = Image.fromarray(orig, mode='L')
        orig, _ = trim_background(orig, max_frame)
        aim = Image.fromarray(orig, mode='L')
        aim.save(os.path.join(os.getcwd(), output_dir, name, str(ext)+".png"), format='PNG')
    return "success"

def draw_region_outlines(mask):
    # Color the mask light green. Color the edges of the mask darker green.
    mask = mask > 0
    new_mask = np.zeros([*mask.shape, 4], dtype = np.uint(8))
    print("mask shape", new_mask.shape)
    distance = ndi.distance_transform_edt(mask)
    print(distance.mean())
    print((mask>0).mean())
    new_mask[:,:,1][mask > 0] = 60
    new_mask[:,:,3][mask > 0] = 100
    print(new_mask.mean(axis=(0, 1)))
    new_mask[:,:, 1][((distance > 0) & (distance <= 2))] = 220
    #print(new_mask.mean(axis=2))
    return new_mask

def add_sobel_edges(mask, img):
        edge_sobel = feature.canny(img, sigma=3)
        edge_sobel[mask == 0] = 0
        distance = ndi.distance_transform_edt(np.logical_not(edge_sobel))
        mask[distance <= 1] = 0
        mask = mask > 0
        remove_small_objects(mask, in_place=True)
        return(mask)




def print_img(img, path):
    os.makedirs(os.path.dirname(path), exist_ok = True)
    ax1 = plt.figure(figsize = (4,4))
    gs1 = gridspec.GridSpec(4, 4)
    gs1.update(wspace=0.025, hspace=0.05) # set the spacing between axes.
    plt.axis('off')
    #plt.set_xticklabels([])
    #ax1.set_yticklabels([])
    #ax1.set_aspect('equal')
    plt.imshow(img, cmap=plt.cm.tab20)
    #ax1.subplots_adjust(wspace=None, hspace=None)
    plt.savefig(path + ".png", format="png")
    return True

def mask_img(img, mask, path):
    print(path)
    print("mean", img.mean())
    aim = Image.fromarray(img.astype(np.uint8), mode='L')
    aim.save(os.path.join(path + ".jpeg"), format='JPEG')

    #m = np.ones((mask.shape[0], mask.shape[1], 1))*50
    print(mask.shape)
    print("mask mean", mask[:,:,3].mean())
    #mm = np.concatenate((mask, m), axis=2)
    mim = Image.fromarray(mask, mode='RGBA')
    mim.save(os.path.join(path + "a.png"), format='PNG')
    print(img.shape)
    rgbimg = Image.new("RGBA", aim.size)
    rgbimg.paste(aim)
    #rgbimg.paste(mim)
    rgbimg.paste(mim, (0, 0), mim)
    rgbimg.save(os.path.join(path + ".png"), format='PNG')


def save_partition(mask, path):
    mask = mask.astype(np.uint8)
    pickle.dump(mask, open( path + ".p", "wb" ))



def guess_bounds(regions_map, reference_map):
    '''
    Guess the bounds of the region based on reference region
    (generally neighboring slice).

    '''
    reference_regions = regionprops(reference_map)
    new_regions = regionprops(regions_map)
    # Initialize a large array of ones that we will use to track the distance
    # from each organ region on new slice to known regions on previous slice.
    ref_regions = np.ones([regions_map.shape[0], regions_map.shape[1], len(reference_regions)]) * 1000

    labels_array = np.array([x.label for x in reference_regions])
    # Rather complex logic for figuring out which region in the reference.
    # For each region in the reference slice, we estimate its projection onto the new slice as follows:
    #   Any pixels of the new slice that are considered organ pixels that come within
    #   three pixels of that organ on the reference slice are mapped to that region.
    #   Then we measure shift of the center of mass of the new region vs the projected region
    #   And also measure growth/shrinkage.
    # From there, update the projection of reference region onto new slice by applying
    # the shift and growth/shrinkage computed from the estimate.
    # Finally, map every pixel in the new slice to the region whose projection it's closest to.
    for i, ref_region in enumerate(reference_regions):
        # Create a mask of each reference region.
        regmask = np.zeros_like(reference_map)
        regmask[reference_map == ref_region.label] = 1
        # In case the region has grown from the reference slice to the slice, allow
        # it to expand up to 3 pixels.
        regmask = morphology.dilation(regmask, morphology.square(3)) * regions_map > 0
        regmask = regmask.astype(np.int32)
        if np.sum(regmask) == 0:
            continue

        c1 = ref_region.centroid
        c2 = regionprops(regmask)[0].centroid
        centroid_move = (round(c2[0]-c1[0]), round(c2[1]-c1[1]))
        growth_ratio = ref_region.area - regionprops(regmask)[0].area
        marginal_growth = int(round(growth_ratio / max(ref_region.perimeter, 1)))
        expected_newslice = (reference_map == ref_region.label)
        expected_newslice = expected_newslice.astype(np.int32)

        if marginal_growth >= 1:
            expected_newslice = morphology.dilation(
                expected_newslice, morphology.square(marginal_growth))
        elif marginal_growth <= -1:
            expected_newslice = morphology.erosion(
                expected_newslice, morphology.square(-1*marginal_growth))
        expected_newslice = shift(expected_newslice, centroid_move, cval=0)

        ref_regions[:,:,i] = ndi.distance_transform_edt(np.ones_like(expected_newslice) - expected_newslice)
    next_region_id = labels_array.max() + 1


    # make a map dict of which region touches which other region, so we can map the relevant pixels.
    labelmap ={}
    for region in new_regions:
        labelmap[region.label] = [x for x in np.unique(reference_map * (regions_map == region.label)) if x > 0]


    finalfinal = np.zeros_like(regions_map)
    for i in range(finalfinal.shape[0]):
        for j in range(finalfinal.shape[1]):
            pixel_val = regions_map[i,j]
            if pixel_val == 0 or not labelmap[pixel_val]:
                continue
            poss_labels = labelmap[pixel_val]
            labels_idx = [list(labels_array).index(x) for x in poss_labels]
            candidates = ref_regions[i][j][labels_idx]
            #TODO: this should be filtered by whether there is any intersection at all with this layer
            finalfinal[i][j] = poss_labels[list(candidates).index(min(candidates))]

    finalfinal = finalfinal * (regions_map > 0)


    # If the region doesn't touch any existing organ, give it a new ID.
    for new_region in new_regions:
        if not ((regions_map == new_region.label) & (reference_map > 0)).sum():
            finalfinal[regions_map == new_region.label] = next_region_id
            next_region_id += 1
    return finalfinal


def compute_slice_width():
    path = "/Users/eiofinova/niftynet/data/ct_dicom/" + name
    mask_path = "/Users/eiofinova/niftynet/data/mask_jpg/"
    files = [pydicom.dcmread(os.path.join(path, f)) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
    if not files:
        return
    patient_position = files[0].PatientPosition
    # Patient scans are either "feet first" (FFS) or "head first" (HFS). If FFS, they must be reversed.
    reverse = patient_position == "FFS"
    files.sort(key=lambda x: float(x.SliceLocation), reverse=reverse)
    return (name, abs(round((files[0].SliceLocation - files[-1].SliceLocation) / len(files), 1)), len(files))


def get_green_histogram(name):
    mask_path = "/Users/eiofinova/niftynet/data/mask_jpg/"
    files = [f for f in os.listdir(mask_path) if os.path.isfile(os.path.join(mask_path, f)) \
             and f.startswith(name)]
    if not files:
        return []
    files.sort()
    print("number of hist files", len(files))
    return [skio.imread(os.path.join(mask_path, file)).mean() for file in files]


def get_longest_frame_interval(name, threshold=1):
    sat_values = get_green_histogram(name + "-")
    longest_interval = [0, 0]
    current_start = -1
    for i, val in enumerate(sat_values):
        if val > threshold and current_start < 0:
            current_start = i
        elif (val <= threshold and current_start > 0) or (i == len(sat_values) - 1 and current_start > 0):
            if i - current_start - 1 > longest_interval[1] - longest_interval[0]:
                longest_interval = [current_start, i - 1]
            current_start = -1
    return longest_interval

def win_scale(data, wl, ww, dtype, out_range):
    """
    Scale pixel intensity data using specified window level, width, and intensity range.
    """
    data_new = np.empty(data.shape, dtype=np.double)
    data_new.fill(out_range[1]-1)

    data_new[data <= (wl-ww/2.0)] = out_range[0]
    data_new[(data>(wl-ww/2.0))&(data<=(wl+ww/2.0))] = \
         ((data[(data>(wl-ww/2.0))&(data<=(wl+ww/2.0))]-(wl-0.5))/(ww-1.0)+0.5)*(out_range[1]-out_range[0])+out_range[0]
    data_new[data > (wl+ww/2.0)] = out_range[1]-1

    return data_new.astype(dtype)

def extract_pixels_for_viewing(dicom):
    pixels = dicom.pixel_array
    hu = pixels * dicom.RescaleSlope + dicom.RescaleIntercept
    return win_scale(hu, 60, 400, np.uint8, [0, 255])


def trim_background(img, dims = None):
    # Trim out background and table
    black = np.zeros_like(img)
    black[img < 10] = 1
    black[img >= 10] = 2
    black[:,0 ]= 1
    #markers[:,10 ]= 1
    black[:,-1 ]= 1
    black_label, num_classes = label(black, background=0, connectivity=1, return_num=1)

    markers = np.zeros_like(img)
    markers[black_label != 1] = 1
    m_label, num_classes = label(markers, background=0, connectivity=1, return_num=1)
    m_label = m_label.astype(np.uint8)
    remove_small_objects(m_label, min_size=50000, in_place=True)
    #remove everything that is not the body
    img2 = img*m_label
    # Make a bounding box around the body
    if not dims:
        bbox = False
        for i, region in enumerate(regionprops(m_label)):
            minr, minc, maxr, maxc = region.bbox
            bbox = True
        if not bbox:
            show_scan(markers)
            show_scan(m_label)
            show_scan(img)
            puaurint("nothing :/")
    else:
        minr, minc, maxr, maxc = dims

    return(img2[minr:maxr, minc:maxc], [minr, minc, maxr, maxc])

def show_scan(img, title=None):
    fig, axes = plt.subplots(1, 2, figsize=(15, 5), sharey=True, sharex=True)

    if title:
        fig.set_title(title)
    # Plot the slice and also the same slice with a spectral color map
    axes[0].imshow(img, cmap=plt.cm.gray)
    axes[0].set_title('original image')
    axes[0].axis('off')

    axes[1].imshow(img, cmap=plt.cm.nipy_spectral)
    axes[1].set_title('original image - emphasizing variation')
    axes[1].axis('off')

def partition_at_threshold(img, thresh, square_size, min_size, title=None, show_plot=True):
    if show_plot:
        fig, axes = plt.subplots(1, 2, figsize=(15, 5), sharey=True, sharex=True)
        if title:
            fig.suptitle(title)

    # Now start looking for the border of the image. Filter out anything below threshold
    bw = ndi.gaussian_filter(img, sigma=(1), order=0) > thresh
    if show_plot:
        axes[0].imshow(bw, cmap=plt.cm.gray)
        axes[0].set_title('thresholded on intensity')
        axes[0].axis('off')

    # Smooth what remains
    remove_small_holes(bw, area_threshold=40, in_place=True)
    remove_small_objects(bw, min_size=min_size, in_place=True)
    cleared = closing(bw, square(square_size))
    distance = ndi.distance_transform_edt(np.logical_not(cleared))
    mask = np.zeros_like(distance)
    mask[distance <= 2] = 1
    distance = ndi.distance_transform_edt(mask)
    cleared = np.zeros_like(distance)
    cleared[distance > 2] = 1

    if show_plot:
        axes[1].imshow(cleared, cmap=plt.cm.gray)
        axes[1].set_title('cleaned up by removing small holes/objects')
        axes[1].axis('off')

    #Find the boundary
    #boundary = sobel(cleared)
    #boundary = boundary > threshold_otsu(boundary)
    #remove_small_objects(boundary, in_place=True)
    #axes[2, 0].imshow(boundary, cmap=plt.cm.gray)
    #axes[2, 0].set_title('edges')
    #axes[2, 0].axis('off')
    return cleared


def compute_preliminary_masks(patient_id, input_dir=None, output_dir=None):
    bones_thresh = [200, 2, 64]
    blood_vessels_thresh = [165, 5, 64]
    liver_thresh = [130, 1, 64]

    if not input_dir:
        input_dir = "assets/niftynet_raw_images"
    if not output_dir:
        output_dir = "assets/masks"

    file_dir = os.path.join(os.getcwd(), "assets", "niftynet_raw_images", str(patient_id))
    os.makedirs(os.path.join(os.getcwd(), "assets", "masks2", str(patient_id)), exist_ok = True)
    slices = [int(x.split(".")[0]) for x in os.listdir(file_dir)]

    for slice in slices:
        img_path = os.path.join(input_dir, "%d/%d.png" % (patient_id, slice))
        img = skio.imread(img_path)
        mask = partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
        imgb = img.copy() * (1 - mask)
        mask = partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
        imgb = imgb * (1 - mask)
        liver = partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
        edge_sobel = feature.canny(img, sigma=3)
        edge_sobel[liver == 0] = 0
        distance = ndi.distance_transform_edt(np.logical_not(edge_sobel))
        liver[distance <= 1] = 0
        mask = liver > 0
        remove_small_objects(mask, in_place=True)
        liver[mask==0] = 0
        newliver = label(liver)
        newliver[newliver>0] = newliver[newliver>0] + 2
        print(os.path.join(output_dir, "%d/%d" % (patient_id, slice)))
        save_partition(newliver, os.path.join(output_dir, "%d/%d" % (patient_id, slice)))

def label_image(img, orig=None, show_plot=True):
    if show_plot:
        fig, axes = plt.subplots(1, 2, figsize=(15, 5), sharey=True, sharex=True)

    # Finally, use watershed to imperfectly partition the organs.
    distance = ndi.distance_transform_edt(img)
    local_maxi = peak_local_max(
        distance, indices=False, footprint=np.ones((60, 60)), labels=img)
    markers = ndi.label(local_maxi)[0]
    labels = morphology.watershed(-distance, markers, mask=img)
    if show_plot:
        axes[0].imshow(labels, cmap=plt.cm.nipy_spectral)
        axes[0].set_title('watershed segmentation')
        axes[0].axis('off')
        if len(orig) > 0:
            axes[1].imshow(orig, cmap=plt.cm.gray)
            axes[1].set_title('Original image')
            axes[1].axis('off')
    return labels

