# RadiPOP doxygen documentation 


## Generate documentation
Run the following command inside the "Documentation" directory: 

    doxygen 

This will create 2 directories:

- html/
- latex/
    
If needed a PDF can be generated from the latex files: 

    cd latex 
    make 
    

## View documentation 
The documentation can either be viewed as a webpage in browser (preferred): 

    html/index.html

or as a PDF: 

    latex/refman.pdf


## Doxygen configuration (if needed)
This step is only necessary if you want to make changes to the documentation production rules. E.g.: Which files to include... <br>
Edit the following file: 

    Doxyfile