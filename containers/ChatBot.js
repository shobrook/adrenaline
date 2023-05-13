import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { HiRefresh } from "react-icons/hi";

import QueryInput from "./QueryInput";
import Message from "./Message";
import Mixpanel from "../library/mixpanel";

class ChatBot extends Component {
    render() {
        const {
            onSubmitQuery,
            onClearConversation,
            messages,
            onUpgradePlan,
            setFileContext
        } = this.props;

        return (
            <div id="chatBot">
                <div id="messages">
                    {messages.map((message, index) => {
                        const {
                            content,
                            isResponse,
                            isComplete,
                            isPaywalled,
                            sources,
                            steps
                        } = message;

                        return (
                            <Message
                                isResponse={isResponse}
                                isComplete={isComplete}
                                isPaywalled={isPaywalled}
                                onUpgradePlan={onUpgradePlan}
                                sources={sources}
                                steps={steps}
                                isFirstMessage={index == 0}
                                isLastMessage={index == messages.length - 1}
                                setFileContext={setFileContext}
                            >
                                {content}
                            </Message>
                        );
                    })}
                </div>
                <div>
                    <QueryInput onSubmitQuery={onSubmitQuery} />
                    <div id="chatbotOptions" onClick={onClearConversation}>
                        <HiRefresh size={16} />
                        <span>Clear conversation</span>
                    </div>
                </div>
            </div>
        );
    }
}

export default withAuth0(ChatBot);