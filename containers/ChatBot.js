import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { HiRefresh } from "react-icons/hi";
import { BsFillFileEarmarkCodeFill } from "react-icons/bs";

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
            setFileContext,
            codebaseId,
            onToggleBrowseCode,
            isBrowseCodeToggled
        } = this.props;

        let suggestedMessages;
        if (messages.length > 1 || codebaseId == "" || codebaseId == null) {
            suggestedMessages = [];
        } else {
            suggestedMessages = [{ preview: "What does this codebase do?", content: "What does this codebase do?" }];
        }

        return (
            <>
                <div id="chatBotHeader">
                    <span id="chatBotLabel">AI Assistant</span>
                    <div 
                        id="browseCodeButton" 
                        className={isBrowseCodeToggled ? "activeBrowseCode" : ""}
                        onClick={onToggleBrowseCode}
                    >
                        <BsFillFileEarmarkCodeFill size={18} fill="#DBE2F0" />
                        <span>Browse code</span>
                    </div>
                </div>
                <div id="chatBotLowerHalf">
                    <div id="messages">
                        {messages.map((message, index) => {
                            const {
                                content,
                                isResponse,
                                isComplete,
                                isPaywalled,
                                sources,
                                steps,
                                progress
                            } = message;

                            return (
                                <Message
                                    isResponse={isResponse}
                                    isComplete={isComplete}
                                    isPaywalled={isPaywalled}
                                    onUpgradePlan={onUpgradePlan}
                                    sources={sources}
                                    steps={steps}
                                    progress={progress}
                                    isFirstMessage={index == 0}
                                    isLastMessage={index == messages.length - 1}
                                    setFileContext={setFileContext}
                                    onRegenerateAnswer={() => onSubmitQuery(content, true)}
                                >
                                    {content}
                                </Message>
                            );
                        })}
                    </div>
                    <div id="chatbotInputContainer">
                        <QueryInput 
                            onSubmitQuery={onSubmitQuery}
                            suggestedMessages={suggestedMessages}
                            isBlocked={!messages[messages.length - 1].isComplete}
                        />
                        <div id="chatbotOptions" onClick={onClearConversation}>
                            <HiRefresh size={16} />
                            <span>Clear conversation</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default withAuth0(ChatBot);