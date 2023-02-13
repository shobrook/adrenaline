import { Component } from "react";

import Modal from "../components/Modal";

export default class RateLimitModal extends Component {
    render() {
        const { setModalRef, onCloseModal } = this.props;

        return (
            <Modal 
                setModalRef={setModalRef} 
                onCloseModal={onCloseModal}
                header="You've hit your request limit"
                subHeader="Paid plan with additional features coming soon. Stay tuned."
            />
        );
    }
}
