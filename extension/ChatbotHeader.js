import React, { Component } from "react";
import { BsFullscreenExit, BsXCircle } from "react-icons/bs";
import IndexingButton from "./IndexingButton";

export default class ChatbotHeader extends Component {
    constructor(props) {
        super(props);

        this.onMinimize = this.onMinimize.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    /* Event Handlers */

    onMinimize() {
        window.parent.postMessage("minimizeChatbot", "*"); // TODO: Restrict origin
    }

    onClose() {
        window.parent.postMessage("closeChatbot", "*"); // TODO: Restrict origin
    }

    /* Lifecycle Methods */

    render() {
        return (
            <div className="ext-chatBotHeader">
                <IndexingButton {...this.props} />
                <div className="ext-chatBotOptions">
                    <BsFullscreenExit onClick={this.onMinimize} />
                    <BsXCircle onClick={this.onClose} />
                </div>
            </div>
        );
    }
}