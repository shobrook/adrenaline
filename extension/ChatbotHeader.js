import { Component } from "react";
import { GoScreenNormal, GoXCircle } from "react-icons/go";

import "./styles/ChatbotHeader.css";

export default class ChatbotHeader extends Component {
    render() {
        const { repository } = this.props;

        return (
            <div className="chatBotHeader">
                {/* TODO: Show 'View on Adrenaline' button */}
                <span className="chatBotLabel">Adrenaline <span>Chat</span></span>
                <div className="chatBotOptions">
                    <GoScreenNormal />
                    <GoXCircle />
                </div>
            </div>
        );
    }
}