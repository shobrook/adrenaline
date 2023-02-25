import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import InputField from './InputField';
import ChatMessage from './ChatMessage';
import { DEMO_CODE } from "../library/constants";

import '../styles/ChatBot.css';

const WS = process.env.REACT_APP_WS || ''

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.consolidateChatHistory = this.consolidateChatHistory.bind(this);
        this.onSendMessage = this.onSendMessage.bind(this);
        this.onSendSuggestedMessage = this.onSendSuggestedMessage.bind(this);
        this.renderChatMessages = this.renderChatMessages.bind(this);
        this.onRegenerateResponse = this.onRegenerateResponse.bind(this);

        this.state = { messages: [] };
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

    onSendMessage(message, isRegeneration = false) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { code, errorMessage, shouldUpdateContext } = this.props;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        if (!isAuthenticated) {
            this.ws.send(JSON.stringify({ is_init: false, token: null }));
            this.setState({ messages: [...messages, { message, isUserSubmitted: true, isComplete: true }] });

            return;
        }

        getAccessTokenSilently()
            .then(token => {
                this.ws.send(JSON.stringify({
                    is_init: false,
                    token,
                    user_id: user.sub,
                    email: user.email,
                    query: message,
                    chat_history: this.consolidateChatHistory(),
                    error_message: errorMessage,
                    is_suggested: false,
                    code,
                    cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                    should_update_context: shouldUpdateContext,
                    is_demo_code: code == DEMO_CODE.join("\n")
                }));

                if (!isRegeneration) {
                    this.setState({ messages: [...messages, { message, isUserSubmitted: true, isComplete: true }] });
                }
            })
    }

    onSendSuggestedMessage(message) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { resetSuggestedMessages, code, errorMessage, shouldUpdateContext } = this.props;
        const { preview, prompt } = message;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");
        console.log(isAuthenticated)
        if (!isAuthenticated) {
            this.ws.send(JSON.stringify({ is_init: false, token: null }));
            this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true, isComplete: true }] });
            resetSuggestedMessages();

            return;
        }

        getAccessTokenSilently()
            .then(token => {
                this.ws.send(JSON.stringify({
                    is_init: false,
                    token,
                    user_id: user.sub,
                    email: user.email,
                    query: prompt,
                    chat_history: this.consolidateChatHistory(),
                    code,
                    error_message: errorMessage,
                    is_suggested: true,
                    cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                    should_update_context: shouldUpdateContext,
                    is_demo_code: code == DEMO_CODE.join("\n")
                }));
                this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true, isComplete: true }] });
                resetSuggestedMessages();
            })
    }

    onRegenerateResponse() {
        // NOTE: Only available for the latest response

        const { messages } = this.state;
        const lastQuery = messages[messages.length - 2].message;

        this.setState({ messages: [...messages.slice(0, messages.length - 1), { message: "", isUserSubmitted: false }] })
        this.onSendMessage(lastQuery, true);
    }

    renderChatMessages() {
        const { messages } = this.state;
        const {
            onSuggestChanges,
            waitingForSuggestedChanges, // TODO: This is being applied to every chat message, need to restrict to just the one clicked
            onUpgradePlan
        } = this.props;

        return messages.map((messagePayload, index) => {
            const { isUserSubmitted, message, isComplete, isBlocked } = messagePayload;

            return (
                <ChatMessage
                    isUserSubmitted={isUserSubmitted}
                    onSuggestChanges={onSuggestChanges}
                    waitingForSuggestedChanges={waitingForSuggestedChanges}
                    onRegenerateResponse={this.onRegenerateResponse}
                    isComplete={isComplete}
                    isLastMessage={index == messages.length - 1}
                    isBlocked={isBlocked}
                    onUpgradePlan={onUpgradePlan}
                >
                    {message}
                </ChatMessage>
            );
        });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (window.location.protocol === "https:") {
            this.ws = new WebSocket(`wss://localhost:5000/generate_chat_response`);
        } else {
            this.ws = new WebSocket(`ws://localhost:5000/generate_chat_response`);
        }

        this.ws.onopen = event => {
            if (!isAuthenticated) {
                this.ws.send(JSON.stringify({ is_init: true, token: null }));
                localStorage.removeItem("cachedDocumentIds")
            } else {
                getAccessTokenSilently()
                    .then(token => {
                        this.ws.send(JSON.stringify({
                            is_init: true,
                            token: token
                        }));
                        localStorage.removeItem("cachedDocumentIds")
                    });
            }
        };
        this.ws.onmessage = event => {
            const { message, document_ids, is_rate_limit_error } = JSON.parse(event.data);
            const { messages } = this.state;
            const { shouldUpdateContext, setCachedDocumentIds } = this.props;

            let response = {
                message,
                isUserSubmitted: false,
                isComplete: false,
                isBlocked: is_rate_limit_error
            };

            if (messages.length == 0) {
                this.setState({ messages: [response] });
                return;
            }

            const lastMessage = messages[messages.length - 1];
            if (message !== "STOP") {
                if (!lastMessage.isUserSubmitted) {
                    response.message = lastMessage.message + message;
                    this.setState({ messages: [...messages.splice(0, messages.length - 1), response] });
                } else {
                    this.setState({ messages: [...messages, response] });
                }
            } else {
                response = lastMessage;
                response.isComplete = true;
                this.setState({ messages: [...messages.splice(0, messages.length - 1), response] });

                if (shouldUpdateContext) {
                    setCachedDocumentIds(document_ids);
                }
            }
        };

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