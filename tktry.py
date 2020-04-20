from tkinter import *
from random import randint
from tkinter import filedialog
from skimage import io as skio
from skimage.measure import label, regionprops
from PIL import Image, ImageTk, ImageDraw
import os
import numpy as np
import colorsys
import dicom_utils
import json

# crappy code for creating colors, w00t
N = 81
p = 9
myn = [int(i/p) + (i%p)*p for i in range(N)]
myn2 = [0.9 - int(i/p)/(p-1)*0.9 for i in range(N)]
myn3 = [1-(0.9 - int(i/p)/(p-1)*0.9) for i in range(N)]
HSV_tuples = [(myn[x]*1.0/N, myn2[x], myn2[x]) for x in range(N)]
RGB_tuples = list(map(lambda x: list(colorsys.hsv_to_rgb(*x)), HSV_tuples))


def assign_colors(mask):
    display_liver = dicom_utils.draw_region_outlines(mask)
    for row in range(mask.shape[0]):
        for col in range(mask.shape[1]):
            if mask[row, col] == 1:
                display_liver[row, col] = [200, 0, 0, 128]
            elif mask[row, col] == 2:
                display_liver[row, col] = [0, 0, 200, 128]
    return display_liver
    #mask = label(mask)
    display_liver = np.zeros([mask.shape[0], mask.shape[1], 4])
    for row in range(mask.shape[0]):
        for col in range(mask.shape[1]):
            if mask[row, col] >= 3:
                display_liver[row, col] = RGB_tuples[mask[row, col] - 3] + [0.2]
            elif mask[row, col] == 1:
                display_liver[row, col] = [0.9, 0, 0, 0.5]
            elif mask[row, col] == 2:
                display_liver[row, col] = [0, 0, 0.9, 0.5]

    display_liver = display_liver*255
    display_liver = display_liver.astype(np.uint8)
    return display_liver
#  http://effbot.org/tkinterbook/tkinter-events-and-bindings.htm
#  http://infohost.nmt.edu/tcc/help/pubs/tkinter/web/index.html
#  http://zetcode.com/gui/tkinter/drawing/

# Features:
# Open patient and flip through frames - v1 done
# Draw line to separate organs - line drawing is done
# Label liver (lobes, spleen)
# Organ lights up when clicked - v1 done
# Organ label consistency across slices
# Mark and ignore messed up slices
# Still missing:
# Check that save button works
# Make configurable how far to extend corrections to each side
# Display which slices were hand-corrected and which have liver/spleen
# Extend threshold adjustments

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
        thresholds_file = "/Users/eiofinova/niftynet/thresholds.json"
        with open(thresholds_file, 'r') as f:
            self.thresholds = json.load(f)
        self.thresholds = {int(k): v for k, v in self.thresholds.items()}
        questionable_slices_file = "/Users/eiofinova/niftynet/questionable_slices.json"
        with open(questionable_slices_file, 'r') as f:
            self.questionable_slices = json.load(f)
        self.questionable_slices = {int(k): [int(x) for x in v] for k, v in self.questionable_slices.items()}
        print(self.questionable_slices)

        self.pack()
        self.createWidgets()

        #master.bind('a', self.thicknessPlus)
        #master.bind('s', self.thicknessMinus)
        # load the .gif image file

        # put gif image on canvas
        # pic's upper left corner (NW) on the canvas is at x=50 y=10


    def createWidgets(self):
        print("creating!")
        tk_rgb = "#%02x%02x%02x" % (128, 192, 200)

        self.leftFrame = Frame(self, bg = tk_rgb)
        self.leftFrame.pack(side = LEFT, fill = Y)

        self.label = Label(self.leftFrame, text = "enter patient id ")
        self.label.grid(row = 0, column = 0, sticky = NW, pady = 2, padx = 3)
        #-----------------------------------------------
        #self.entryFrame = Frame(self.leftFrame)
        #self.entryFrame.grid(row = 1, column = 0,
        #                      sticky = NW, pady = 2, padx = 3)

        #self.myEntry1 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        #self.myEntry1.pack(side = LEFT, pady = 2, padx = 4)
        # Create a Tkinter variable
        self.tkvar = IntVar(root)

        # Dictionary with options
        choices = {p for p in self.patients}
        self.tkvar.set(1) # set the default option

        patientMenu = OptionMenu(self.leftFrame, self.tkvar, *choices,
                                 command=self.SetPatient)
        #Label(mainframe, text="Choose a dish").grid(row = 1, column = 0)
        patientMenu.grid(row = 1, column =0)
        #----------------------------------------------
        #self.bttn1 = Button(self.leftFrame,
        #                     text = "Load patient", command = self.SetPatient)
        #self.bttn1.grid(row = 2, column = 0, pady = 2, padx = 3, sticky = NW)

        self.labelThickness = Label(
                            self.leftFrame,
                            text = "Select slice")
        self.labelThickness.grid(row = 3,
                                 column = 0, pady = 2, padx = 3)

        self.myScale = Scale(
                            self.leftFrame, from_ = 1, to = 250,
                            orient = HORIZONTAL,
                            command = self.setSlice
                            )
        self.myScale.set(1)
        self.myScale.grid(
                          row = 4, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )


        self.buttonPartition = Button(self.leftFrame, text = "correct partition",
                                      command = self.partitionOrgans)
        self.buttonPartition.grid(padx = 3, pady = 2,
                                    row = 10, column = 0,
                                    sticky = NW)

        self.buttonAccept = Button(self.leftFrame, text = "OK",
                                      command = self.setPartition)
        self.buttonAccept.grid(padx = 3, pady = 2,
                                    row = 10, column = 1,
                                    sticky = NW)

        self.buttonDeleteAll = Button(self.leftFrame, text = "clear edits",
                                      command = self.deleteAll)
        self.buttonDeleteAll.grid(padx = 3, pady = 2,
                                    row = 11, column = 0,
                                    sticky = NW)

        self.buttonLabelLiver = Button(self.leftFrame, text = "set liver label",
                                      command = self.labelLiver)
        self.buttonLabelLiver.grid(padx = 3, pady = 2,
                                    row = 12, column = 0,
                                    sticky = NW)

        self.buttonLabelSpleen = Button(self.leftFrame, text = "set spleen label",
                                      command = self.labelSpleen)
        self.buttonLabelSpleen.grid(padx = 3, pady = 2,
                                    row = 13, column = 0,
                                    sticky = NW)
        self.buttonToggleMask = Button(self.leftFrame, text = "hide mask",
                                       command = self.toggleMask)
        self.buttonToggleMask.grid(padx = 3, pady = 2,
                                    row = 14, column = 0,
                                    sticky = NW)
        self.boneIntensityScale = Scale(
                            self.leftFrame, from_ = 120, to = 220,
                            orient = HORIZONTAL,
                            command = self.set_liver_intensity)
        self.boneIntensityScale.set(200)
        self.boneIntensityScale.grid(
                          row = 15, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )
        self.bloodVesselIntensityScale = Scale(
                            self.leftFrame, from_ = 100, to = 200,
                            orient = HORIZONTAL,
                            command = self.set_liver_intensity)
        self.bloodVesselIntensityScale.set(170)
        self.bloodVesselIntensityScale.grid(
                          row = 16, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )
        self.liverIntensityScale = Scale(
                            self.leftFrame, from_ = 100, to = 200,
                            orient = HORIZONTAL,
                            command = self.set_liver_intensity)
        self.liverIntensityScale.set(120)
        self.liverIntensityScale.grid(
                          row = 17, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )
        self.buttonExtendInt = Button(self.leftFrame, text = "set thresholds globally",
                                       command = self.extend_thresholds)
        self.buttonExtendInt.grid(padx = 3, pady = 2,
                                    row = 18, column = 0,
                                    sticky = NW)
        self.quest = IntVar()
        self.questCheck = Checkbutton(self.leftFrame, text='Bad slice',
                                      variable=self.quest,
                                      onvalue=1, offvalue=0, command=self.label_quest)
        self.questCheck.grid(
                          row = 19, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )
        self.entryFrame = Frame(self.leftFrame)
        self.entryFrame.grid(row = 25, column = 0,
                              sticky = NW, pady = 2, padx = 3)

        self.entry_label = Label(self.leftFrame, text = "Expansion bounds (L/R)")
        self.entry_label.grid(row = 22, column = 0, sticky = NW, pady = 2, padx = 3)
        self.myEntry1 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        self.myEntry1.pack(side = LEFT, pady = 2, padx = 4)
        self.myEntry1.insert(END, 10)
        self.myEntry2 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        self.myEntry2.pack(side = LEFT, pady = 2, padx = 4)
        self.myEntry2.insert(END, 10)
        self.buttonExtend = Button(self.leftFrame, text = "extend liver/spleen labels",
                                       command = self.extend_labels)
        self.buttonExtend.grid(padx = 3, pady = 2,
                                    row = 26, column = 0,
                                    sticky = NW)
        self.buttonSave = Button(self.leftFrame, text = "save",
                                      command = self.fileSave)
        self.buttonSave.grid(padx = 3, pady = 2,
                                    row = 30, column = 0,
                                    sticky = NW)
#----------------------------------------------------------------------
        self.myCanvas = Canvas(self, width = 800,
                                height = 500, relief=RAISED, borderwidth=5)
        self.myCanvas.pack(expand=YES, fill=BOTH)
        self.myCanvas.bind("<Button-1>", self.highlightOrgan)

#----------------------------------------------------------------------
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

    def labelLiver(self):
        # TODO Jen - bug - if liver is in multiple pieces they should
        # be independently togglable.
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
            print(np.bincount(mymask.astype(np.uint8).ravel()))
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



    def extend_labels(self):
        cur_idx = self.slices.index(self.slice_idx)
        ref_slice_idx = self.slice_idx
        left_extend = int(self.myEntry1.get())
        right_extend = int(self.myEntry2.get())
        for i in range(1, min(left_extend, cur_idx)):
            self.masks[self.slice_idx - i] = dicom_utils.guess_bounds(self.masks[self.slice_idx - i], self.masks[ref_slice_idx])
            ref_slice_idx = self.slice_idx - i
        ref_slice_idx = self.slice_idx
        for i in range(1, min(right_extend, len(self.slices) - cur_idx)):
            self.masks[self.slice_idx + i] = dicom_utils.guess_bounds(self.masks[self.slice_idx + i], self.masks[ref_slice_idx])
            ref_slice_idx = self.slice_idx + i

    def extend_thresholds(self):
        bone_intensity = self.boneIntensityScale.get()
        blood_vessel_intensity = self.bloodVesselIntensityScale.get()
        liver_intensity = self.liverIntensityScale.get()
        blood_vessels_thresh = [blood_vessel_intensity, 5, 64]
        bones_thresh = [bone_intensity, 2, 64]
        liver_thresh = [liver_intensity, 1, 64]
        for slice_idx in self.slices:
            img_path = os.path.join(os.getcwd(), "assets", "niftynet_raw_images", str(self.patient_id), str(slice_idx) + ".png")
            img = skio.imread(img_path)
            mask = dicom_utils.partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
            imgb = img.copy() * (1 - mask)
            mask = dicom_utils.partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
            imgb = imgb * (1 - mask)
            liver = dicom_utils.partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
            liver = dicom_utils.add_sobel_edges(liver, img)
            mask = label(liver)
            mask[mask>0] = mask[mask>0] + 2
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
            draw.line(coords, fill=0, width=2)
        result = np.array(myimg)
        self.masks[self.slice_idx] = label(result)
        self.masks[self.slice_idx][ self.masks[self.slice_idx] > 0] = self.masks[self.slice_idx][ self.masks[self.slice_idx] > 0] + 2

        #highlight = Image.fromarray(result.astype(np.uint8))
        #myimg = ImageTk.PhotoImage(highlight)
        #root.mask = myimg
        #self.mask_img = self.myCanvas.create_image(0, 0, image=myimg, anchor=NW)
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
        self.myCanvas.bind("<Button-1>", self.enableLineDrawing)


    def load_masks(self, patient_id):
        file_dir = os.path.join(os.getcwd(), "assets", "masks", str(patient_id))
        self.masks = {int(file.split(".")[0]): np.loadtxt(os.path.join(file_dir, file), dtype=np.uint8) for file in os.listdir(file_dir) }

    def set_threshold_toggles(self):
        thresholds = self.thresholds[self.patient_id]
        self.boneIntensityScale.set(thresholds['bones_thresh'][0])
        self.bloodVesselIntensityScale.set(thresholds['blood_vessels_thresh'][0])
        self.liverIntensityScale.set(thresholds['liver_thresh'][0])
        if 'slice_idx' in thresholds.keys():
            return thresholds['slice_idx']
        else:
            return None

    def SetPatient(self, choice):
        val1 = int(self.tkvar.get())
        val1 = int(choice)
        if val1 in self.patients:
            self.patient_id = val1
            good_slice = self.set_threshold_toggles()
            self.load_masks(self.patient_id)
            self.label.configure(text = "Current patient: %d" % val1)
            patient_dir = os.path.join(self.file_dir, str(self.patient_id))
            self.slices = [int(x.split(".")[0]) for x in os.listdir(patient_dir)]
            self.slices.sort()
            self.myScale.configure(from_ = self.slices[0], to=self.slices[-1])
            self.slice_idx = good_slice or self.slices[0]
            self.myScale.set(self.slice_idx)
            self.showMask = True
            self.loadSlice()


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
        #int_file_dir = os.path.join(os.getcwd(), "assets", "masks", str(patient), str(slice) + ".txt")
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
        img_path = os.path.join(os.getcwd(), "assets", "niftynet_raw_images", str(self.patient_id), str(self.slice_idx) + ".png")
        img = skio.imread(img_path)
        mask = dicom_utils.partition_at_threshold(img, *bones_thresh, title="Bones", show_plot=False)
        imgb = img.copy() * (1 - mask)
        mask = dicom_utils.partition_at_threshold(imgb, *blood_vessels_thresh, title="Blood vessels", show_plot=False)
        imgb = imgb * (1 - mask)
        liver = dicom_utils.partition_at_threshold(imgb, *liver_thresh, title = "Organs/Liver", show_plot=False)
        liver = dicom_utils.add_sobel_edges(liver, img)
        mask = label(liver)
        mask[mask>0] = mask[mask>0] + 2
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

    def deleteAll(self):
        print("deleting")
        self.previousX = -1
        self.previousY = -1
        self.myCanvas.delete("all")
        self.loadSlice()

    def fileSave(self):
        for slice in self.slices():
            np.savetxt('/Users/eiofinova/niftynet/assets/masks/%s/%s' % (str(self.patient_id), str(self.slice_idx)))

root = Tk()
root.title("Segmentation Editor")
app = Application(root)
root.mainloop()
