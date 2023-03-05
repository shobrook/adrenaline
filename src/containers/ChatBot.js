import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import InputField from './InputField';
import ChatMessage from './ChatMessage';
import { DEMO_CODE } from "../library/constants";
import Mixpanel from "../library/mixpanel";

import '../styles/ChatBot.css';

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.consolidateChatHistory = this.consolidateChatHistory.bind(this);
        this.onSendMessage = this.onSendMessage.bind(this);
        this.onSendSuggestedMessage = this.onSendSuggestedMessage.bind(this);
        this.renderChatMessages = this.renderChatMessages.bind(this);
        this.onRegenerateResponse = this.onRegenerateResponse.bind(this);

        this.state = {
            messages: [
                {
                    message: "I'm an AI assistant that can help debug your code. What seems to be the problem?",
                    isUserSubmitted: false,
                    isComplete: false,
                    isBlocked: false,
                    isLoading: false
                }
            ]
        };
    }

    /* Utilities */

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    consolidateChatHistory() {
        const { messages } = this.state;

        if (messages.length <= 1) {
            return [];
        }

        const chatHistory = messages.slice(1, messages.length).reduce((r, m, i) => {
            const { message } = m;
            if (i % 2) {
                r[r.length - 1].push(message);
            } else {
                r.push([message]);
            }

            return r;
        }, []);

        return chatHistory;
    }

    /* Event Handlers */

    onSendMessage(message, isRegeneration = false, isSuggested = false) {
        Mixpanel.track("click_send_message", { isRegeneration, isSuggested });

        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { code, clearSuggestedMessages, errorMessage, shouldUpdateContext } = this.props;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        clearSuggestedMessages();

        if (!isAuthenticated) {
            this.setState({
                messages: [
                    ...messages,
                    { message, isUserSubmitted: true, isComplete: true },
                    {
                        message: "You must be logged in to use the chatbot.",
                        isUserSubmitted: false,
                        isComplete: false
                    }
                ]
            });
        } else if (!isRegeneration) {
            this.setState({
                messages: [
                    ...messages,
                    { message, isUserSubmitted: true, isComplete: true },
                    { message: "", isUserSubmitted: false, isComplete: false, isLoading: true }
                ]
            });
        }

        if (window.location.protocol === "https:") {
            this.ws = new WebSocket(`wss://rubrick-api-production.up.railway.app/generate_chat_response`);
        } else {
            this.ws = new WebSocket(`ws://rubrick-api-production.up.railway.app/generate_chat_response`);
        }

        this.ws.onopen = event => {
            localStorage.removeItem("cachedDocumentIds");

            // Send message
            getAccessTokenSilently()
                .then(token => {
                    this.ws.send(JSON.stringify({
                        is_init: false, // TODO: Remove
                        token,
                        user_id: user.sub,
                        email: user.email,
                        query: message,
                        chat_history: this.consolidateChatHistory(),
                        error_message: errorMessage,
                        code,
                        cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                        should_update_context: shouldUpdateContext,
                        is_demo_code: code == DEMO_CODE.join("\n")
                    }));
                })
        }
        this.ws.onmessage = event => {
            const { message, document_ids, is_rate_limit_error } = JSON.parse(event.data);
            const { messages } = this.state;
            const { shouldUpdateContext, setCachedDocumentIds } = this.props;

            let response = messages[messages.length - 1];
            response.isLoading = false;
            response.isBlocked = is_rate_limit_error;

            if (message !== "STOP") {
                response.message += message;
            } else {
                Mixpanel.track("received_chatbot_response");

                response.isComplete = true;

                if (shouldUpdateContext) {
                    setCachedDocumentIds(document_ids);
                }

                this.ws.close();
            }

            this.setState({ messages: [...messages.splice(0, messages.length - 1), response] });
        }
        this.ws.onerror = event => {
            Mixpanel.track("chatbot_failed_to_respond", { error: event });
            console.log(event);

            // TODO: Tell user via message
        }
    }

    onSendSuggestedMessage(message) {
        this.onSendMessage(message.prompt, false, true);
    }

    onRegenerateResponse() {
        // NOTE: Only available for the latest response

        const { messages } = this.state;
        const lastQuery = messages[messages.length - 2].message;

        this.setState({ messages: [...messages.slice(0, messages.length - 1), { message: "", isUserSubmitted: false, isLoading: true }] })
        this.onSendMessage(lastQuery, true);
    }

    renderChatMessages() {
        const { messages } = this.state;
        const {
            onSuggestChanges,
            waitingForSuggestedChanges // TODO: This is being applied to every chat message, need to restrict to just the one clicked
        } = this.props;

        return messages.map((messagePayload, index) => {
            const { isUserSubmitted, message, isComplete, isBlocked, isLoading } = messagePayload;

            return (
                <ChatMessage
                    isUserSubmitted={isUserSubmitted}
                    onSuggestChanges={onSuggestChanges}
                    waitingForSuggestedChanges={waitingForSuggestedChanges}
                    onRegenerateResponse={this.onRegenerateResponse}
                    isComplete={isComplete}
                    isLastMessage={index == messages.length - 1}
                    isBlocked={isBlocked}
                    isLoading={isLoading}
                >
                    {message}
                </ChatMessage>
            );
        });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        const { suggestedMessages } = this.props;

        return (
            <div id="chatBot">
                <div id="messages">
                    {this.renderChatMessages()}
                    <div style={{ float: "left", clear: "both" }}
                        ref={(el) => { this.messagesEnd = el; }}>
                    </div>
                </div>
                <InputField
                    onSubmit={this.onSendMessage}
                    onSubmitSuggested={this.onSendSuggestedMessage}
                    suggestedMessages={suggestedMessages}
                    placeholder="Ask a question"
                    submitLabel="Send"
                />
            </div>
        );
    }
}

export default withAuth0(ChatBot);