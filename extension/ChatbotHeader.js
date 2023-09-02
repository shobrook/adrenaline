import React, { Component } from "react";
import { BsPinAngle, BsPin, BsXCircle } from "react-icons/bs";
import IndexingButton from "./IndexingButton";
import Mixpanel from "./lib/mixpanel";

export default class ChatbotHeader extends Component {
    constructor(props) {
        super(props);

        this.onPin = this.onPin.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = { isPinned: false };
    }

    /* Event Handlers */

    onPin() {
        Mixpanel.track("pin_chatbot");
        window.parent.postMessage(JSON.stringify({message: "minimizeChatbot"}), "*"); // TODO: Restrict origin
        this.setState(prevState => ({ isPinned: !prevState.isPinned }));
    }

    onClose() {
        const { websocketRef } = this.props;

        Mixpanel.track("close_chatbot");
        window.parent.postMessage(JSON.stringify({message: "closeChatbot"}), "*"); // TODO: Restrict origin

        if (websocketRef.current) {
            websocketRef.current.close();
        }
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