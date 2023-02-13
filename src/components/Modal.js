import { Component } from "react";

import "../styles/Modal.css";

export default class Modal extends Component {
    render() {
        const { setModalRef, onCloseModal, header, subHeader, children } = this.props;

        return (
            <div id="modalBackground" onClick={onCloseModal}>
                <div id="modal" ref={ref => setModalRef(ref)}>
                    <span id="header">{header}</span>
                    {subHeader ? ( <span id="subHeader">{subHeader}</span> ) : null}
                    {children}
                </div>
            </div>
        );
    }
}
