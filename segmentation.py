from tkinter import *
from random import randint
from tkinter import filedialog
from skimage import io as skio
from skimage.measure import label, regionprops
from PIL import Image, ImageTk, ImageDraw
import os
import numpy as np
import colorsys
import segmentation_utils
import json
import pickle


def assign_colors(mask):
    '''
    Display utility; colors every region green with a darker
    green outline; regions labeled 1 and 2 are special (they
    are known liver/spleen) and are colored bright red/blue.
    '''

    display_liver = segmentation_utils.draw_region_outlines(mask)
    for row in range(mask.shape[0]):
        for col in range(mask.shape[1]):
            if mask[row, col] == 1:
                display_liver[row, col] = [200, 0, 0, 128]
            elif mask[row, col] == 2:
                display_liver[row, col] = [0, 0, 200, 128]
    return display_liver

def find_organs(slice_idx, patient_id, bones_thresh, blood_vessels_thresh, liver_thresh):
    '''
    Uses three threshold values (bones threshold, blood vessels threshold, liver_threshold)
    to find organs.

    The algorithm is:
        - After some smoothing, remove every pixel above bones threshold from the image.
        - After some smoothing, remove every pixel above blood vessel threshold.
        - Everything that then remains above liver threshold is called an organ.
        - Use contiguous area divisions to roughly split into organs.
    '''
    img_path = os.path.join(os.getcwd(), "assets", "niftynet_raw_images", str(patient_id), str(slice_idx) + ".png")
    img = skio.imread(img_path)
    mask = segmentation_utils.partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
    imgb = img.copy() * (1 - mask)
    mask = segmentation_utils.partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
    imgb = imgb * (1 - mask)
    liver = segmentation_utils.partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
    liver = segmentation_utils.add_sobel_edges(liver, img)
    mask = label(liver)
    mask[mask>0] = mask[mask>0] + 2
    return mask

# Features:
# Open patient and flip through frames - v1 done
# Draw line to separate organs - line drawing is done
# Label liver (lobes, spleen)
# Organ lights up when clicked - v1 done
# Organ label consistency across slices
# Mark and ignore messed up slices
# Still missing:
# Check that save button works
# Make configurable how far to extend corrections to each side - done
# Display which slices were hand-corrected and which have liver/spleen
# Extend threshold adjustments - done

class Application(Frame):

    def __init__(self, master):
        super().__init__(master)
        self.radiobuttonValue = IntVar()
        self.radiobuttonValue.set(1)
        self.toolsThickness = 3
        self.rgb = "#%02x%02x%02x" % (100, 100, 100)
        self.drawLine = False
        self.previousX = -1
        self.previousY = -1
        self.line_segments = []
        self.lines = []
        self.pixel_value = 0
        self.showMask = True
        self.highlight_img = -1
        self.mask_img = -1
        self.slice_idx = -1
        self.patient_id = 1
        self.file_dir = os.path.join(os.getcwd(), "assets", "niftynet_raw_images")
        self.patients = [int(x) for x in os.listdir(self.file_dir) if len(os.listdir(os.path.join(self.file_dir, str(x)))) > 0]
        print("patients are", self.patients)

        thresholds_file = os.path.join(os.getcwd(), "thresholds.json")
        with open(thresholds_file, 'r') as f:
            self.thresholds = json.load(f)
        self.thresholds = {int(k): v for k, v in self.thresholds.items()}
        questionable_slices_file = os.path.join(os.getcwd(), "questionable_slices.json")
        with open(questionable_slices_file, 'r') as f:
            self.questionable_slices = json.load(f)
        self.questionable_slices = {int(k): [int(x) for x in v] for k, v in self.questionable_slices.items()}

        self.pack()
        self.createWidgets()

    def createWidgets(self):
        tk_rgb = "#%02x%02x%02x" % (128, 192, 200)

        self.leftFrame = Frame(self, bg = tk_rgb)
        self.leftFrame.pack(side = LEFT, fill = Y)

        self.label = Label(self.leftFrame,
                           text = "Patient id ",
                           bg = tk_rgb)
        self.label.grid(row = 0, column = 0, sticky = NW, pady = 2, padx = 3)
        # Create a Tkinter variable
        self.tkvar = IntVar(root)

        choices = {p for p in self.patients}
        self.tkvar.set(1) # set the default option

        patientMenu = OptionMenu(self.leftFrame, self.tkvar, *choices,
                                 command=self.SetPatient)

        patientMenu.grid(row = 0, column =1)
        self.myCanvas = Canvas(self, width = 800,
                                height = 500, relief=RAISED, borderwidth=5)
        tk_rgb = "#%02x%02x%02x" % (128, 192, 200)
        self.labelThickness = Label(
                            self.leftFrame,
                            text = "Select slice",
                            bg = tk_rgb)

        self.myScale = Scale(
                            self.leftFrame, from_ = 1, to = 250,
                            orient = HORIZONTAL,
                            command = self.setSlice
                            )
        self.myScale.set(1)


        self.buttonPartition = Button(self.leftFrame, text = "correct partition",
                                      command = self.partitionOrgans)

        self.buttonAccept = Button(self.leftFrame, text = "OK",
                                      command = self.setPartition)

        self.buttonDeleteAll = Button(self.leftFrame, text = "clear edits",
                                      command = self.deleteAndReload)

        self.buttonLabelLiver = Button(self.leftFrame, text = "set liver label",
                                      command = self.labelLiver)

        self.buttonLabelSpleen = Button(self.leftFrame, text = "set spleen label",
                                      command = self.labelSpleen)
        self.buttonToggleMask = Button(self.leftFrame, text = "hide mask",
                                       command = self.toggleMask)
        self.labelBoneIntensity = Label(
                            self.leftFrame,
                            text = "Bone intensity",
                            bg = tk_rgb)
        self.bone_var = IntVar()
        self.boneIntensityScale = Scale(
                            self.leftFrame, from_ = 120, to = 250,
                            orient = HORIZONTAL,
                            variable = self.bone_var,
                            command = self.set_liver_intensity)
        self.blood_vessel_var = IntVar()
        self.labelBloodVesselIntensity = Label(
                            self.leftFrame,
                            text = "Blood vessel intensity",
                            bg = tk_rgb)
        self.bloodVesselIntensityScale = Scale(
                            self.leftFrame, from_ = 100, to = 250,
                            orient = HORIZONTAL,
                            variable = self.blood_vessel_var,
                            command = self.set_liver_intensity)
        self.liver_var = IntVar()
        self.labelLiverIntensity = Label(
                            self.leftFrame,
                            text = "Liver intensity",
                            bg = tk_rgb)
        self.liverIntensityScale = Scale(
                            self.leftFrame, from_ = 100, to = 250,
                            orient = HORIZONTAL,
                            variable = self.liver_var,
                            command = self.set_liver_intensity)
        self.buttonExtendInt = Button(self.leftFrame, text = "set thresholds globally",
                                       command = self.extend_thresholds)
        self.quest = IntVar()
        self.questCheck = Checkbutton(self.leftFrame, text='Bad slice',
                                      variable=self.quest,
                                      onvalue=1, offvalue=0, command=self.label_quest)
        self.entryFrame = Frame(self.leftFrame)

        self.entry_label = Label(self.leftFrame,
                                 text = "Expansion bounds (L/R)",
                                 bg = tk_rgb)
        self.myEntry1 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        self.myEntry1.pack(side = LEFT, pady = 2, padx = 4)
        self.myEntry1.insert(END, 10)
        self.myEntry2 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        self.myEntry2.pack(side = LEFT, pady = 2, padx = 4)
        self.myEntry2.insert(END, 10)
        self.buttonExtend = Button(self.leftFrame, text = "extend liver/spleen labels",
                                       command = self.extend_labels)
        self.buttonSave = Button(self.leftFrame, text = "save",
                                      command = self.fileSave)
        self.myCanvas.pack(expand=YES, fill=BOTH)
        self.myCanvas.bind("<Button-1>", self.highlightOrgan)


    def hide_button(self):
        print("hiding button")
        self.buttonSave.grid_forget()
        self.buttonExtendInt.grid_forget()

    def show_button(self):
        self.buttonSave.grid(padx = 3, pady = 2,
                                    row = 30, column = 0,
                                    sticky = NW)
        self.buttonExtendInt.grid(padx = 3, pady = 2,
                                    row = 18, column = 0,
                                    sticky = NW)

    def navigation_controls(self):
        return [[self.labelThickness, self.myScale]]

    def slice_editing_controls(self):
        return [[self.questCheck],
                [self.buttonToggleMask],
                [self.labelBoneIntensity],
                [self.boneIntensityScale],
                [self.labelBloodVesselIntensity],
                [self.bloodVesselIntensityScale],
                [self.labelLiverIntensity],
                [self.liverIntensityScale],
                [self.buttonExtendInt],
                [self.buttonPartition],
                [self.buttonAccept, self.buttonDeleteAll],
                ]

    def label_controls(self):
        return [
            [self.buttonLabelLiver],
            [self.buttonLabelSpleen],
            [self.entry_label],
            [self.entryFrame],
            [self.buttonExtend]
        ]

    def save_controls(self):
        return [[self.buttonSave]]


    def show_controls(self, controls, offset):
        for i, control_row in enumerate(controls):
            for j, control_col in enumerate(control_row):
                control_col.grid(
                    row = offset + i,
                    column = j,
                    pady = 2,
                    padx = 3,
                    sticky = NW
                )

    def hide_controls(self, controls):
        for control_row in controls:
            for control in control_row:
                control.grid_forget()


    def setSlice(self, event):
        self.slice_idx = self.myScale.get()
        self.loadSlice()

    def highlightOrgan(self, event):
        y, x = (event.x, event.y)
        if x < self.masks[self.slice_idx].shape[0] and y < self.masks[self.slice_idx].shape[1]:
            self.last_clicked_x = x
            self.last_clicked_y = y
            pixel_value = self.masks[self.slice_idx][x, y]
            if pixel_value == 0:
                self.pixel_value = pixel_value
                self.myCanvas.delete(self.highlight_img)
                self.hide_controls(self.label_controls())
                return
            if self.pixel_value == pixel_value:
                return
            highlight = (self.masks[self.slice_idx] == pixel_value).astype(np.uint8) * 255
            highlight2 = np.zeros((*highlight.shape, 4))
            highlight2[:, :, 1] = highlight
            highlight2[:, :, 3] = 50
            highlight = Image.fromarray(highlight2.astype(np.uint8))
            myimg = ImageTk.PhotoImage(highlight)
            root.myimg = myimg
            self.highlight_img = self.myCanvas.create_image(0, 0, image=myimg, anchor=NW)
            self.pixel_value = pixel_value
            if pixel_value == 1:
                self.buttonLabelLiver.configure(text= "Remove liver label")
            elif pixel_value == 2:
                self.buttonLabelSpleen.configure(text= "Remove spleen label")
            elif pixel_value > 0:
                self.buttonLabelLiver.configure(text= "Set liver label")
                self.buttonLabelSpleen.configure(text= "Set spleen label")
            else:
                self.buttonLabelLiver.configure(text= "")
                self.buttonLabelSpleen.configure(text= "")
            self.show_controls(self.label_controls(), 40)

    def labelLiver(self):
        mymask = self.masks[self.slice_idx]
        if self.pixel_value == 1:
            tempmask = (mymask > 0).astype(np.uint8)
            tempmask = label(tempmask)
            pixel_value = tempmask[self.last_clicked_x, self.last_clicked_y]
            mymask[tempmask==pixel_value] = mymask.max() + 1
            self.buttonLabelLiver.configure(text= "Set liver label")
        elif self.pixel_value > 0:
            mymask[mymask==self.pixel_value] = 1
            self.masks[self.slice_idx] = mymask
            self.buttonLabelLiver.configure(text= "Remove liver label")
        self.displayMask()

    def labelSpleen(self):
        mymask = self.masks[self.slice_idx]
        if self.pixel_value == 2:
            tempmask = (mymask > 0).astype(np.uint8)
            tempmask = label(tempmask)
            pixel_value = tempmask[self.last_clicked_x, self.last_clicked_y]
            mymask[tempmask==pixel_value] = mymask.max() + 1
            self.buttonLabelSpleen.configure(text= "Set spleen label")
        elif self.pixel_value > 0:
            mymask[mymask==self.pixel_value] = 2
            self.masks[self.slice_idx] = mymask
            self.buttonLabelSpleen.configure(text= "Remove spleen label")
        self.displayMask()

    def label_quest(self):
        if self.quest.get() == 1:
            if self.slice_idx not in self.questionable_slices[self.patient_id]:
                self.questionable_slices[self.patient_id].append(self.slice_idx)
        else:
            if self.slice_idx in self.questionable_slices[self.patient_id]:
                self.questionable_slices[self.patient_id] = \
                [x for x in self.questionable_slices[self.patient_id] if x != self.slice_idx]
        self.hide_controls(self.label_controls())


    def extend_labels(self):
        cur_idx = self.slices.index(self.slice_idx)
        ref_slice_idx = self.slice_idx
        left_extend = int(self.myEntry1.get())
        right_extend = int(self.myEntry2.get())
        for i in range(1, min(left_extend+1, cur_idx)):
            self.masks[self.slice_idx - i] = segmentation_utils.guess_bounds(self.masks[self.slice_idx - i], self.masks[ref_slice_idx])
            if self.slice_idx - i in self.questionable_slices:
                ref_slice_idx = self.slice_idx - i
        ref_slice_idx = self.slice_idx
        for i in range(1, min(right_extend+1, len(self.slices) - cur_idx)):
            self.masks[self.slice_idx + i] = segmentation_utils.guess_bounds(self.masks[self.slice_idx + i], self.masks[ref_slice_idx])
            if self.slice_idx + i not in self.questionable_slices:
                ref_slice_idx = self.slice_idx + i

    def extend_thresholds(self):
        bone_intensity = self.boneIntensityScale.get()
        blood_vessel_intensity = self.bloodVesselIntensityScale.get()
        liver_intensity = self.liverIntensityScale.get()
        blood_vessels_thresh = [blood_vessel_intensity, 5, 64]
        bones_thresh = [bone_intensity, 2, 64]
        liver_thresh = [liver_intensity, 1, 64]
        self.thresholds[self.patient_id] = {
            "bones_thresh": bones_thresh,
            "blood_vessels_thresh": blood_vessels_thresh,
            "liver_thresh": liver_thresh,
            "ref_slice_idx": self.slice_idx,
        }
        for slice_idx in self.slices:
            mask = find_organs(slice_idx, self.patient_id,
                               bones_thresh,
                               blood_vessels_thresh,
                               liver_thresh)
            self.masks[slice_idx] = mask
        self.displayMask()


    def setPartition(self):
        self.myCanvas.bind("<Button-1>", self.highlightOrgan)
        self.previousX = -1
        self.previousY = -1
        newmask = self.masks[self.slice_idx] > 0
        myimg = Image.fromarray(newmask.astype(np.uint8))
        draw = ImageDraw.Draw(myimg)
        for coords in self.line_segments:
            draw.line(coords, fill=0, width=3)
        result = np.array(myimg)
        self.masks[self.slice_idx] = label(result)
        self.masks[self.slice_idx][ self.masks[self.slice_idx] > 0] = self.masks[self.slice_idx][ self.masks[self.slice_idx] > 0] + 2

        # delete all the user-drawn lines
        for line in self.lines:
            self.myCanvas.delete(line)
        self.lines = []
        self.line_segments = []
        self.displayMask()
        self.buttonLabelLiver.configure(text= "Set liver label")
        self.buttonLabelSpleen.configure(text= "Set spleen label")


    def partitionOrgans(self):
        self.drawLine = True
        self.hide_controls(self.label_controls())
        self.myCanvas.bind("<Button-1>", self.enableLineDrawing)


    def load_masks(self, patient_id):
        file_dir = os.path.join(os.getcwd(), "assets", "masks", str(patient_id))
        print("loading masks from ", file_dir)
        self.masks = {int(file.split(".")[0]): \
                      pickle.load(open(os.path.join(file_dir, file), 'rb')) for file in os.listdir(file_dir) }

    def set_threshold_toggles(self):
        if self.patient_id in self.thresholds.keys():
            thresholds = self.thresholds[self.patient_id]
        else:
            thresholds = {"bones_thresh": 200,
                          "blood_vessels_thresh": 170,
                          "liver_thresh": 135}
        self.bone_var.set(thresholds['bones_thresh'][0])
        self.blood_vessel_var.set(thresholds['blood_vessels_thresh'][0])
        self.liver_var.set(thresholds['liver_thresh'][0])
        self.liverIntensityScale.set(thresholds['liver_thresh'][0])

        if 'slice_idx' in thresholds.keys():
            return thresholds['slice_idx']
        else:
            return None

    def SetPatient(self, choice):
        self.deleteAll()
        val1 = int(self.tkvar.get())
        val1 = int(choice)
        if val1 in self.patients:
            self.patient_id = val1
            self.load_masks(self.patient_id)
            good_slice = self.set_threshold_toggles()
            self.label.configure(text = "Current patient: %d" % val1)
            patient_dir = os.path.join(self.file_dir, str(self.patient_id))
            self.slices = [int(x.split(".")[0]) for x in os.listdir(patient_dir)]
            self.slices.sort()
            self.myScale.configure(from_ = self.slices[0], to=self.slices[-1])
            self.slice_idx = good_slice or self.slices[0]
            self.myScale.set(self.slice_idx)
            self.showMask = True
            self.loadSlice()
            self.hide_controls(self.label_controls())
            self.hide_controls(self.slice_editing_controls())
            self.show_controls(self.navigation_controls(), 10)
            self.show_controls(self.save_controls(), 100)


        else:
            print("That's not a valid patient!")
        # set focus to something else, not to mess with pressing keys: a,s
        self.focus()


    def loadSlice(self):
        self.drawLine = False
        for line in self.lines:
            self.myCanvas.delete
        file_dir = os.path.join(
            os.getcwd(), "assets", "niftynet_raw_images",
            str(self.patient_id), str(self.slice_idx) + ".png")
        img = PhotoImage(file=file_dir)
        root.img = img
        self.img = self.myCanvas.create_image(0, 0, image=img, anchor=NW)
        self.displayMask()
        if self.slice_idx in self.questionable_slices[self.patient_id]:
            self.quest.set(1)
        else:
            self.quest.set(0)
        for line in self.lines:
            self.myCanvas.delete(line)
        self.lines = []
        self.line_segments = []
        self.buttonLabelLiver.configure(text= "Set liver label")
        self.buttonLabelSpleen.configure(text= "Set spleen label")
        self.show_controls(self.slice_editing_controls(), 20)


    def displayMask(self):
        if self.showMask:
            if self.mask_img > 0:
                self.myCanvas.delete(self.mask_img)
            mask = assign_colors(self.masks[self.slice_idx])
            mask = Image.fromarray(mask.astype(np.uint8))
            self.mask = ImageTk.PhotoImage(mask)
            root.mask = self.mask
            self.mask_img = self.myCanvas.create_image(0, 0, image=self.mask, anchor=NW)


    def toggleMask(self):
        if self.showMask:
            self.showMask = False
            self.myCanvas.delete(self.mask_img)
            if self.highlight_img > 0:
                self.myCanvas.delete(self.highlight_img)
            self.mask_img = -1
            self.highlight_img = -1
            self.buttonToggleMask.configure(text="show mask")
        else:
            self.showMask = True
            self.buttonToggleMask.configure(text="hide mask")
            self.displayMask()

    def set_liver_intensity(self, event):
        bone_intensity = self.boneIntensityScale.get()
        blood_vessel_intensity = self.bloodVesselIntensityScale.get()
        liver_intensity = self.liverIntensityScale.get()
        blood_vessels_thresh = [blood_vessel_intensity, 5, 64]
        bones_thresh = [bone_intensity, 2, 64]
        liver_thresh = [liver_intensity, 1, 64]
        mask = find_organs(self.slice_idx, self.patient_id, bones_thresh, blood_vessels_thresh, liver_thresh)
        self.masks[self.slice_idx] = mask
        self.displayMask()
        self.buttonLabelLiver.configure(text= "Set liver label")
        self.buttonLabelSpleen.configure(text= "Set spleen label")



    def enableLineDrawing(self, event):
            if not self.drawLine:
                print("Drawing mode not enabled")
                return
            else:
                print("drawing OK")
            if self.previousX < 0:
                self.previousX = event.x
                self.previousY = event.y
                return
            x, y = (self.previousX, self.previousY)
            self.previousX = event.x
            self.previousY = event.y
            line = self.myCanvas.create_line(self.previousX, self.previousY,
                                      x, y,
                                      width = self.toolsThickness,
                                      fill = self.rgb)
            self.line_segments.append([self.previousX, self.previousY, x, y])
            self.lines.append(line)

    def deleteAndReload(self):
        self.deleteAll()
        self.loadSlice()

    def deleteAll(self):
        print("deleting")
        self.previousX = -1
        self.previousY = -1
        self.myCanvas.delete("all")
        self.hide_controls(self.label_controls())

    def fileSave(self):
        for slice in self.slices:
            print("saving slice", slice, )
            file_dir = os.path.join(os.getcwd(), "assets", "masks", str(self.patient_id))
            pickle.dump(self.masks[slice],
                        open(os.path.join(file_dir, str(slice) + '.p'), 'wb'))
        with open("./questionable_slices.json", 'w') as f:
            json.dump(self.questionable_slices, f)
        with open("./thresholds.json", 'w') as f:
            json.dump(self.thresholds, f)

root = Tk()
root.title("Segmentation Editor")
app = Application(root)
root.mainloop()
