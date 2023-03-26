import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import QueryInput from "./QueryInput";
import Message from "./Message";
import Mixpanel from "../library/mixpanel";

import "../styles/ChatBot.css";

class ChatBot extends Component {
    /* Utilities */

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        const {
            onSubmitQuery,
            messages,
            onUpgradePlan
        } = this.props;

        return (
            <div id="chatBot">
                <div id="messages">
                    {messages.map(message => {
                        const {
                            content,
                            isResponse,
                            isComplete,
                            isPaywalled
                        } = message;

                        return (
                            <Message
                                isResponse={isResponse}
                                isComplete={isComplete}
                                isPaywalled={isPaywalled}
                                onUpgradePlan={onUpgradePlan}
                            >
                                {content}
                            </Message>
                        );
                    })}
                    <div style={{ float: "left", clear: "both" }}
                        ref={(el) => { this.messagesEnd = el; }}>
                    </div>
                </div>
                <QueryInput onSubmitQuery={onSubmitQuery} />
            </div>
        );
    }
}

export default withAuth0(ChatBot);