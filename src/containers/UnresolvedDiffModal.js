import { Component } from "react";

import Modal from "../components/Modal";

export default class UnresolvedDiffModal extends Component {
    render() {
        const { setModalRef, onCloseModal } = this.props;

        return (
            <Modal 
                setModalRef={setModalRef} 
                onCloseModal={onCloseModal}
                header="Resolve diffs before debugging your code again"
                subHeader="Click the 'Use Me' button above one of the diff headers to either accept or reject Adrenaline's changes."
            />
        );
    }
}
