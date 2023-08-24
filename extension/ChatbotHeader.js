import React, { Component } from "react";
import { BsFullscreenExit, BsXCircle } from "react-icons/bs";

export default class ChatbotHeader extends Component {
    constructor(props) {
        super(props);

        this.onExit = this.onExit.bind(this);
    }

    /* Event Handlers */

    onPin() {
        return; // TODO
    }

    onExit() {
        window.parent.postMessage('closeIframe', '*')
    }

    /* Lifecycle Methods */

    render() {
        const { repository } = this.props;

        return (
            <div className="ext-chatBotHeader">
                {/* TODO: Show 'View on Adrenaline' button */}
                <span className="ext-chatBotLabel">Adrenaline <span>Chat</span></span>
                <div className="ext-chatBotOptions">
                    <BsFullscreenExit />
                    <BsXCircle onClick={this.onExit} />
                </div>
            </div>
        );
    }
}