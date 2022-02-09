import { Component } from "react";
import { createPortal } from "react-dom";

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
