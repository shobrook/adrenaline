import React, { Component } from "react";
import { BsFullscreenExit, BsXCircle } from "react-icons/bs";

export default class ChatbotHeader extends Component {
    render() {
        const { repository } = this.props;

        return (
            <div className="ext-chatBotHeader">
                {/* TODO: Show 'View on Adrenaline' button */}
                <span className="ext-chatBotLabel">Adrenaline <span>Chat</span></span>
                <div className="ext-chatBotOptions">
                    <BsFullscreenExit />
                    <BsXCircle />
                </div>
            </div>
        );
    }
}