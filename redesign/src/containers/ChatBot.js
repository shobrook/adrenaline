import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import QueryInput from "./QueryInput";
import Message from "./Message";
import Mixpanel from "../library/mixpanel";

import "../styles/ChatBot.css";

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.state = { processedFiles: [] }
    }

    /* Lifecycle Methods */



    render() {
        const {
            onSubmitQuery,
            onSetCodebaseId,
            messages
        } = this.props;

        return (
            <div id="chatBot">
                <QueryInput
                    onSubmitQuery={onSubmitQuery}
                    onSetCodebaseId={onSetCodebaseId}
                />

                <div id="messages">
                    {messages.reverse().map(message => {
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
                            >
                                {content}
                            </Message>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default withAuth0(ChatBot);