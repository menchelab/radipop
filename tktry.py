from tkinter import *
from random import randint
from tkinter import filedialog
from skimage import io as skio
from skimage.measure import label, regionprops
from PIL import Image, ImageTk, ImageDraw
import os
import numpy as np
import colorsys

# crappy code for creating colors, w00t
N = 81
p = 9
myn = [int(i/p) + (i%p)*p for i in range(N)]
myn2 = [0.9 - int(i/p)/(p-1)*0.9 for i in range(N)]
myn3 = [1-(0.9 - int(i/p)/(p-1)*0.9) for i in range(N)]
print(myn2)
print(myn)
HSV_tuples = [(myn[x]*1.0/N, myn2[x], myn2[x]) for x in range(N)]
RGB_tuples = list(map(lambda x: list(colorsys.hsv_to_rgb(*x)), HSV_tuples))


def assign_colors(mask):
    mask = label(mask)
    display_liver = np.zeros([mask.shape[0], mask.shape[1], 4])
    for row in range(mask.shape[0]):
        for col in range(mask.shape[1]):
            if mask[row, col] > 0:
                display_liver[row, col] = RGB_tuples[mask[row, col] - 1] + [0.2]
    print("mmean", display_liver[:,:,3].mean())
    display_liver = display_liver*255
    display_liver = display_liver.astype(np.uint8)
    print("mmean", display_liver[:,:,3].mean())
    return display_liver
#  http://effbot.org/tkinterbook/tkinter-events-and-bindings.htm
#  http://infohost.nmt.edu/tcc/help/pubs/tkinter/web/index.html
#  http://zetcode.com/gui/tkinter/drawing/

# Features:
# Open patient and flip through frames - v1 done
# Draw line to separate organs - line drawing is done, need the application portion
# Label liver (lobes, spleen)
# Organ lights up when clicked - v1 done

class Application(Frame):

    def __init__(self, master):
        super().__init__(master)
        self.radiobuttonValue = IntVar()
        self.radiobuttonValue.set(1)
        self.toolsThickness = 2
        self.rgb = "#%02x%02x%02x" % (100, 100, 100)
        self.drawLine = False
        self.previousX = -1
        self.previousY = -1
        self.line_segments = []
        self.lines = []
        self.pixel_value = 0
        self.showMask = True
        self.highlight_img = -1

        self.pack()
        self.createWidgets()

        master.bind('a', self.thicknessPlus)
        master.bind('s', self.thicknessMinus)
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
        self.entryFrame = Frame(self.leftFrame)
        self.entryFrame.grid(row = 1, column = 0,
                              sticky = NW, pady = 2, padx = 3)

        self.myEntry1 = Entry(self.entryFrame, width = 5, insertwidth = 3)
        self.myEntry1.pack(side = LEFT, pady = 2, padx = 4)
        #----------------------------------------------
        self.bttn1 = Button(self.leftFrame,
                             text = "Load patient", command = self.SetPatient)
        self.bttn1.grid(row = 2, column = 0, pady = 2, padx = 3, sticky = NW)

        self.labelThickness = Label(
                            self.leftFrame,
                            text = "Position selector")
        self.labelThickness.grid(row = 3,
                                 column = 0, pady = 2, padx = 3)

        self.myScale = Scale(
                            self.leftFrame, from_ = 1, to = 25,
                            orient = HORIZONTAL,
                            command = self.setSlice
                            )
        self.myScale.set(2)
        self.toolsThickness = 2
        self.myScale.grid(
                          row = 4, column = 0,
                          pady = 2, padx = 3, sticky = S,
                          )

        self.labelTools = Label(
                                self.leftFrame,
                                text = "Editing tools",
                                )
        self.labelTools.grid(
                             row = 5, column = 0,
                             pady = 2, padx = 3,
                             sticky = NW
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

        self.buttonLabelLiver = Button(self.leftFrame, text = "toggle liver label",
                                      command = self.labelLiver)
        self.buttonLabelLiver.grid(padx = 3, pady = 2,
                                    row = 12, column = 0,
                                    sticky = NW)

        self.buttonLabelSpleen = Button(self.leftFrame, text = "toggle spleen label",
                                      command = self.labelSpleen)
        self.buttonLabelSpleen.grid(padx = 3, pady = 2,
                                    row = 13, column = 0,
                                    sticky = NW)
        self.buttonToggleMask = Button(self.leftFrame, text = "hide mask",
                                       command = self.toggleMask)
        self.buttonToggleMask.grid(padx = 3, pady = 2,
                                    row = 14, column = 0,
                                    sticky = NW)
        self.buttonSave = Button(self.leftFrame, text = "save",
                                      command = self.fileSave)
        self.buttonSave.grid(padx = 3, pady = 2,
                                    row = 20, column = 0,
                                    sticky = NW)
#----------------------------------------------------------------------
        self.myCanvas = Canvas(self, width = 800,
                                height = 500, relief=RAISED, borderwidth=5)
        self.myCanvas.pack(expand=YES, fill=BOTH)
        self.myCanvas.bind("<Button-1>", self.highlightOrgan)

#----------------------------------------------------------------------
    def setSlice(self, event):
        self.slice = self.myScale.get()
        self.loadSlice(self.patient_id, self.slice)

    def highlightOrgan(self, event):
        y, x = (event.x, event.y)
        print("highlighting ", x, y)
        print(self.img_internal.shape)
        if x < self.img_internal.shape[0] and y < self.img_internal.shape[1]:
            print("inside image %d %d" % (x, y))
            pixel_value = self.img_internal[x, y]
            print("pixel value ", pixel_value)
            if pixel_value == 0:
                self.pixel_value = pixel_value
                self.myCanvas.delete(self.highlight_img)
                return
            if self.pixel_value == pixel_value:
                return
            highlight = (self.img_internal == pixel_value).astype(np.uint8) * 255
            print("avg highlight value ", highlight.mean())
            highlight2 = np.zeros((*highlight.shape, 4))
            highlight2[:, :, 0] = highlight
            highlight2[:, :, 3] = 50
            highlight = Image.fromarray(highlight2.astype(np.uint8))
            myimg = ImageTk.PhotoImage(highlight)
            root.myimg = myimg
            self.highlight_img = self.myCanvas.create_image(0, 0, image=myimg, anchor=NW)
            self.pixel_value = pixel_value

    def labelLiver(self):
        if self.pixel_value > 0:
            self.liver.add(self.pixel_value)

    def labelSpleen(self):
        if self.pixel_value > 0:
            self.spleen.add(self.pixel_value)

    def setPartition(self):
        self.myCanvas.bind("<Button-1>", self.highlightOrgan)
        self.previousX = -1
        self.previousY = -1
        newmask = self.img_internal > 0
        myimg = Image.fromarray(newmask.astype(np.uint8))
        print(newmask.mean())
        draw = ImageDraw.Draw(myimg)
        for coords in self.line_segments:
            draw.line(coords, fill=0, width=2)
        result = np.array(myimg)
        print("result mean ", result.mean())
        print(result.shape)
        self.img_internal = label(result)
        result = assign_colors(result)

        highlight = Image.fromarray(result.astype(np.uint8))
        myimg = ImageTk.PhotoImage(highlight)
        root.mask = myimg
        self.mask_img = self.myCanvas.create_image(0, 0, image=myimg, anchor=NW)
        # delete all the user-drawn lines
        for line in self.lines:
            self.myCanvas.delete(line)

        if False:
            #highlight = result * 255
            print("avg highlight value ", highlight.mean())
            highlight2 = np.zeros((*highlight.shape[:2], 4))
            highlight2[:, :, 0] = highlight[0]
            highlight2[:, :, 1] = highlight[2]
            highlight2[:, :, 1] = highlight[1]
            highlight2[:, :, 3] = 250
            highlight = Image.fromarray(highlight2.astype(np.uint8))
            myimg = ImageTk.PhotoImage(highlight)
            root.myimg = myimg
            self.highlight_img = self.myCanvas.create_image(0, 0, image=myimg, anchor=NW)
        #result = label(result)

        # here we should make the partition/relabeling happen in real life.

    def partitionOrgans(self):
        self.drawLine = True
        self.myCanvas.bind("<Button-1>", self.setPreviousXY)

    def SetPatient(self):
        file_dir = os.path.join(os.getcwd(), "assets", "niftynet_raw_images")
        patients = [int(x) for x in os.listdir(file_dir) if len(os.listdir(os.path.join(file_dir, str(x)))) > 0]
        print("patients are", patients)
        val1 = int(self.myEntry1.get())
        if val1 in patients:
            self.patient_id = val1
            self.label.configure(text = "Current patient: %d" % val1)
            patient_dir = os.path.join(file_dir, str(self.patient_id))
            self.slices = [int(x.split(".")[0]) for x in os.listdir(patient_dir)]
            self.slices.sort()
            self.myScale.configure(from_ = self.slices[0], to=self.slices[-1])
            self.myScale.set(self.slices[0])
            self.current_slice = self.slices[0]
            self.loadSlice(self.patient_id, self.current_slice)
            self.showMask = True


        else:
            print("That's not a valid patient!")
        # set focus to something else, not to mess with pressing keys: a,s
        self.focus()


    def loadSlice(self, patient, slice):
        file_dir = os.path.join(os.getcwd(), "assets", "niftynet_raw_images", str(patient), str(slice) + ".png")
        int_file_dir = os.path.join(os.getcwd(), "assets", "masks", str(patient), str(slice) + ".txt")
        img = PhotoImage(file=file_dir)
        root.img = img
        self.img_internal = np.loadtxt(int_file_dir)
        print(self.img_internal.mean())
        self.img = self.myCanvas.create_image(0, 0, image=img, anchor=NW)
        mask = assign_colors(self.img_internal)
        print("mask avg ", mask.mean())
        highlight = Image.fromarray(mask.astype(np.uint8))
        self.myimg = ImageTk.PhotoImage(highlight)
        root.mask = self.myimg
        self.mask_img = self.myCanvas.create_image(0, 0, image=self.myimg, anchor=NW)

    def toggleMask(self):
        if self.showMask:
            self.showMask = False
            print("hiding mask")
            self.myCanvas.delete(self.mask_img)
            if self.highlight_img > 0:
                self.myCanvas.delete(self.highlight_img)
            self.mask_img = -1
            self.highlight_img = -1
            self.buttonToggleMask.configure(text="show mask")
        else:
            self.showMask = True
            self.mask_img = self.myCanvas.create_image(0, 0, image=self.myimg, anchor=NW)
            self.buttonToggleMask.configure(text="hide mask")


    def setPreviousXY(self, event):
            print("now drawing")
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
        self.loadSlice(self.patient_id, self.slice)

    def thicknessPlus(self, event):
        if self.toolsThickness < 25:
            self.toolsThickness += 1
            self.myScale.set(self.toolsThickness)

    def thicknessMinus(self, event):
        if 1 < self.toolsThickness:
            self.toolsThickness -= 1
            self.myScale.set(self.toolsThickness)

    def fileSave(self):
        f = filedialog.asksaveasfile(mode='w', defaultextension=".txt")
        if f is None: # asksaveasfile return `None` if dialog closed with "cancel".
            return
        text2save = str(text.get(1.0, END)) # starts from `1.0`, not `0.0`
        f.write(text2save)
        f.close() # `()` was missing.

root = Tk()
root.title("Segmentation Editor")
app = Application(root)
root.mainloop()
