import React, { Component } from "react";
import { BsFullscreenExit, BsXCircle } from "react-icons/bs";

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
        const { repository } = this.props;

        return (
            <div className="ext-chatBotHeader">
                <span className="ext-chatBotLabel">Adrenaline <span>Chat</span></span>
                <div className="ext-chatBotOptions">
                    <BsFullscreenExit onClick={this.onMinimize} />
                    <BsXCircle onClick={this.onClose} />
                </div>
            </div>
        );
    }
}