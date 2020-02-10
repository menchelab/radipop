from PIL import Image
from scipy import ndimage as ndi
from skimage import data, morphology
from skimage import io as skio
from skimage.color import label2rgb
from skimage.exposure import histogram
from skimage.feature import peak_local_max
from skimage.filters import sobel, roberts, prewitt, threshold_otsu
from skimage.measure import label, regionprops
from skimage.morphology import closing, opening, square, remove_small_holes, remove_small_objects
from skimage.segmentation import clear_border
import dicom2nifti
import matplotlib.pyplot as plt
import numpy as np
import os
import pydicom
import sys
import matplotlib.gridspec as gridspec
from skimage import io
import io as jio

def create_images_for_display(name, reverse=False):
    path = "/Users/eiofinova/niftynet/data/ct_dicom/" + name
    mask_path = "/Users/eiofinova/niftynet/data/mask_jpg/"
    #!mkdir -p {os.path.join(os.getcwd(), "assets/niftynet_masked_images", name)}
    #!mkdir -p {os.path.join(os.getcwd(), "assets/niftynet_raw_images", name)}
    files = [pydicom.dcmread(os.path.join(path, f)) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
    if not files:
        return
    patient_position = files[0].PatientPosition
    # Patient scans are either "feet first" (FFS) or "head first" (HFS). If FFS, they must be reversed.
    reverse = patient_position == "FFS"
    files.sort(key=lambda x: float(x.SliceLocation), reverse=reverse)
    #print(name, "slice width ", abs(round((files[0].SliceLocation - files[-1].SliceLocation) / len(files), 1)), len(files))


    organs = get_longest_frame_interval(name)
    print(organs)
    files = files[organs[0]:organs[1]]

    num_slides = len(files)


    plt.figure(figsize = (4,4))
    gs1 = gridspec.GridSpec(4, 4)
    gs1.update(wspace=0.025, hspace=0.05) # set the spacing between axes.

    from matplotlib.pyplot import figure
    figure(num=None, figsize=(16, 16))

    for i, file in enumerate(files):
        #file = file[50]

        idx = int(i/16)

        ext = i + organs[0]
        try:
            mask = io.imread(os.path.join(mask_path, '%s-slice%s.jpg' % (name, str(ext).zfill(3))))
        except:
            print(os.path.join(mask_path, '%s-slice%s.jpg' % (name, str(ext).zfill(3))))
            continue
        # Keep only the green channel.
        mask[:,:,0] = 0
        mask[:,:,2] = 0
        orig = extract_pixels_for_viewing(file)
        aim = Image.fromarray(orig, mode='L')
        orig, frame = trim_background(orig)
        aim = Image.fromarray(orig, mode='L')
        mask = mask[frame[0]:frame[2],frame[1]:frame[3],:]

        m = np.ones((mask.shape[0], mask.shape[1], 1))*50
        mm = np.concatenate((mask, m), axis=2)
        mim = Image.fromarray(np.uint8(mm))
        aim.save(os.path.join(os.getcwd(), "assets/niftynet_raw_images", name, str(ext)+".jpg"), format='JPEG')
        rgbimg = Image.new("RGBA", aim.size)
        rgbimg.paste(aim)
        rgbimg.paste(mim, (0, 0), mim)

        ds = file
        rgbimg.save(os.path.join(os.getcwd(), "assets/niftynet_masked_images/", name, str(ext)+".png"), format='PNG')
        if i % 16 == 0 and idx < 16:
            ax1 = plt.subplot(gs1[idx])
            plt.axis('off')
            ax1.set_xticklabels([])
            ax1.set_yticklabels([])
            ax1.set_aspect('equal')
            plt.subplots_adjust(wspace=None, hspace=None)
            #plt.imshow(rgbimg)
    plt.savefig("assets/sample_crossections/" + name + ".png", format="png")


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
    return [skio.imread(os.path.join(mask_path, file)).mean() for file in files]


def get_longest_frame_interval(name, threshold=1):
    sat_values = get_green_histogram(name)
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


def trim_background(img):
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
    bbox = False
    for i, region in enumerate(regionprops(m_label)):
        minr, minc, maxr, maxc = region.bbox
        bbox = True
    if not bbox:
        show_scan(markers)
        show_scan(m_label)
        show_scan(img)
        print("nothing :/")

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

def partition_at_threshold(img, thresh, square_size, min_size, title=None):
    fig, axes = plt.subplots(1, 2, figsize=(15, 5), sharey=True, sharex=True)
    if title:
        fig.suptitle(title)

    # Now start looking for the border of the image. Filter out anything below threshold
    bw = ndi.gaussian_filter(img, sigma=(1), order=0) > thresh
    # Let's look it
    axes[0].imshow(bw, cmap=plt.cm.gray)
    axes[0].set_title('thresholded on intensity')
    axes[0].axis('off')

    # Smooth what remains
    remove_small_holes(bw, area_threshold=40, in_place=True)
    remove_small_objects(bw, min_size=min_size, in_place=True)
    cleared = closing(bw, square(square_size))
    #cleared = ndi.binary_fill_holes(cleared)
    distance = ndi.distance_transform_edt(np.logical_not(cleared))
    mask = np.zeros_like(distance)
    mask[distance <= 2] = 1
    distance = ndi.distance_transform_edt(mask)
    cleared = np.zeros_like(distance)
    cleared[distance > 2] = 1

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

def label_image(img, orig=None):
    fig, axes = plt.subplots(1, 2, figsize=(15, 5), sharey=True, sharex=True)

    # Finally, use watershed to imperfectly partition the organs.
    distance = ndi.distance_transform_edt(img)
    local_maxi = peak_local_max(
        distance, indices=False, footprint=np.ones((60, 60)), labels=img)
    markers = ndi.label(local_maxi)[0]
    labels = morphology.watershed(-distance, markers, mask=img)
    axes[0].imshow(labels, cmap=plt.cm.nipy_spectral)
    axes[0].set_title('watershed segmentation')
    axes[0].axis('off')
    if True:
        axes[1].imshow(orig, cmap=plt.cm.gray)
        axes[1].set_title('Original image')
        axes[1].axis('off')
    return labels

