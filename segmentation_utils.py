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


def draw_region_outlines(mask):
    """! Color the mask light green. Color the edges of the mask darker green.
    @param mask mask for which to color the outlines

    @return mask with colored outlines
    """
    mask = mask > 0
    new_mask = np.zeros([*mask.shape, 4], dtype = np.uint(8))
    distance = ndi.distance_transform_edt(mask)
    new_mask[:,:,1][mask > 0] = 60
    new_mask[:,:,3][mask > 0] = 100
    new_mask[:,:, 1][((distance > 0) & (distance <= 2))] = 220
    return new_mask

def add_sobel_edges(mask, img):
    """! Smooth edges
    Steps:
        - Edge filter image using the Canny algorithm.
        - euclidean distance transform

    @param mask mask corresponding to image
    @param img image corresponding to mask

    @return mask with smoothed edges
    """
    edge_sobel = feature.canny(img, sigma=3)
    edge_sobel[mask == 0] = 0
    distance = ndi.distance_transform_edt(np.logical_not(edge_sobel))
    mask[distance <= 1] = 0
    mask = mask > 0
    remove_small_objects(mask, in_place=True)
    return(mask)

def save_partition(mask, path):
    mask = mask.astype(np.uint8)
    pickle.dump(mask, open( path + ".p", "wb" ))



def guess_bounds(regions_map, reference_map):
    '''!Guess the bounds/labels of the region based on reference region
    Guess the bounds/labels of the region based on reference region
    (generally neighboring slice).

    @param regions_map mask to guess labels for
    @param reference_map reference mask (already labelled)

    @return mask (labelled)
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


def partition_at_threshold(img, thresh, square_size, min_size, title=None, show_plot=True):
    """! After some smoothing, calculate new mask for img
    Steps:
        - gaussian filter,
        - remove small objects,
        - greyscale morphological closing,
        - euclidean distance transform

        @param img type numpy.ndarray
        @param thres Threshold value
        @param min_size Minimum size of an organ in the mask
        @param squaresize For greyscale morphological closing
        @param title Title of plot
        @param show_plot Show plot True/False

        @return New binary mask (same size as img)
    """
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

    #Remove objects smaller than the specified size.
    remove_small_holes(bw, area_threshold=40, in_place=True)
    #Remove objects smaller than the specified size.
    remove_small_objects(bw, min_size=min_size, in_place=True)
    #Return greyscale morphological closing of an image.
    cleared = closing(bw, square(square_size))
    # Exact euclidean distance transform.
    distance = ndi.distance_transform_edt(np.logical_not(cleared))
    mask = np.zeros_like(distance)
    mask[distance <= 2] = 1
    distance = ndi.distance_transform_edt(mask)
    cleared = np.zeros_like(distance)

    # Smooths the edges of organs
    cleared[distance > 2] = 1

    if show_plot:
        axes[1].imshow(cleared, cmap=plt.cm.gray)
        axes[1].set_title('cleaned up by removing small holes/objects')
        axes[1].axis('off')

    return cleared

