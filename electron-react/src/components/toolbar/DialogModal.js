import { Component } from "react";
import { createPortal } from "react-dom";
import '../../styles/DialogModal.css';

/**
 * Creates a window for the dcm2png conversion dialog
 * @memberof toolbar
 * @class DialogModal 
 * @example
 *   <DialogModal>
 *       <div className="dialog-wrapper">
 *           <h3>Set clipping values for dicom conversion</h3>
 *           <form onSubmit={_onSubmit}>
 *               <button onClick={handleDicomClips} type="submit">Set</button>
 *           </form>
 *       </div>
 *   </DialogModal>
 */

class DialogModal extends Component {
    constructor() {
        super();
        this.body = document.getElementsByTagName("div")[0];
        this.el = document.createElement("div");
        this.el.id = "dialog-root";
    }

    componentDidMount() {
        this.body.appendChild(this.el);
    }

    componentWillUnmount() {
        this.body.removeChild(this.el);
    }

    render() {
        return createPortal(this.props.children, this.el);
    }
}

export default DialogModal;
