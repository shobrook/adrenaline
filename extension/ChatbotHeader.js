import React, { Component } from "react";
import { BsPinAngle, BsPin, BsXCircle } from "react-icons/bs";
import IndexingButton from "./IndexingButton";

export default class ChatbotHeader extends Component {
    constructor(props) {
        super(props);

        this.onPin = this.onPin.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = { isPinned: false };
    }

    /* Event Handlers */

    onPin() {
        window.parent.postMessage(JSON.stringify({message: "minimizeChatbot"}), "*"); // TODO: Restrict origin
        this.setState(prevState => ({ isPinned: !prevState.isPinned }));
    }

    onClose() {
        window.parent.postMessage(JSON.stringify({message: "closeChatbot"}), "*"); // TODO: Restrict origin
    }

    /* Lifecycle Methods */

    render() {
        const { isPinned } = this.state;

        return (
            <div className="ext-chatBotHeader">
                <IndexingButton {...this.props} />
                <div className="ext-chatBotOptions">
                    {isPinned ? (
                        <BsPin onClick={this.onPin} />
                    ) : (
                        <BsPinAngle onClick={this.onPin} />
                    )}
                    <BsXCircle onClick={this.onClose} />
                </div>
            </div>
        );
    }
}