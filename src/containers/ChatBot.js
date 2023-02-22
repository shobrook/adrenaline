import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import InputField from './InputField';
import ChatMessage from '../components/ChatMessage';

import '../styles/ChatBot.css';

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.consolidateChatHistory = this.consolidateChatHistory.bind(this);
        this.onSendMessage = this.onSendMessage.bind(this);
        this.onSendSuggestedMessage = this.onSendSuggestedMessage.bind(this);

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

    onSendMessage(message) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { code, errorMessage, shouldUpdateContext } = this.props;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        if (!isAuthenticated) {
            this.ws.send(JSON.stringify({ is_init: false, token: null }));
            this.setState({ messages: [...messages, { message, isUserSubmitted: true }] });

            return;
        }

        getAccessTokenSilently()
            .then(token => {
                this.ws.send(JSON.stringify({
                    is_init: false,
                    token,
                    user_id: user.sub,
                    query: message,
                    chat_history: this.consolidateChatHistory(),
                    error_message: errorMessage,
                    is_suggested: false,
                    code,
                    cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                    should_update_context: shouldUpdateContext
                }));
                this.setState({ messages: [...messages, { message, isUserSubmitted: true }] });
            })
    }

    onSendSuggestedMessage(message) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { resetSuggestedMessages, code, errorMessage, shouldUpdateContext } = this.props;
        const { preview, prompt } = message;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        if (!isAuthenticated) {
            this.ws.send(JSON.stringify({ is_init: false, token: null }));
            this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true }] });
            resetSuggestedMessages();

            return;
        }

        getAccessTokenSilently()
            .then(token => {
                this.ws.send(JSON.stringify({
                    is_init: false,
                    token,
                    user_id: user.sub,
                    query: prompt,
                    chat_history: this.consolidateChatHistory(),
                    code,
                    error_message: errorMessage,
                    is_suggested: true,
                    cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                    should_update_context: shouldUpdateContext
                }));
                this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true }] });
                resetSuggestedMessages();
            })
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (window.location.protocol === "https:") {
            this.ws = new WebSocket("wss://staging-rubrick-api-production.up.railway.app/generate_chat_response");
        } else {
            this.ws = new WebSocket("ws://staging-rubrick-api-production.up.railway.app/generate_chat_response");
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
            const { message, document_ids } = JSON.parse(event.data);
            const { messages } = this.state;
            const { shouldUpdateContext, setCachedDocumentIds } = this.props;

            if (messages.length == 0) {
                this.setState({ messages: [{ message, isUserSubmitted: false }] });
                return;
            }

            if (message != "STOP") {
                const lastMessage = messages[messages.length - 1];
                if (!lastMessage.isUserSubmitted) {
                    this.setState({ messages: [...messages.splice(0, messages.length - 1), { message: lastMessage.message + message, isUserSubmitted: false }] });
                } else {
                    this.setState({ messages: [...messages, { message, isUserSubmitted: false }] });
                }
            } else if (shouldUpdateContext) {
                setCachedDocumentIds(document_ids);
            }
        };

        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        const { messages } = this.state;
        const { suggestedMessages } = this.props;

        return (
            <div id="chatBot">
                <div id="messages">
                    {messages.map(messagePayload => {
                        const { isUserSubmitted, message } = messagePayload;

                        return (<ChatMessage isUserSubmitted={isUserSubmitted}>{message}</ChatMessage>);
                    })}
                    <div style={{ float: "left", clear: "both" }}
                        ref={(el) => { this.messagesEnd = el; }}>
                    </div>
                </div>
                <InputField
                    onSubmit={this.onSendMessage}
                    onSubmitSuggested={this.onSendSuggestedMessage}
                    suggestedMessages={suggestedMessages}
                    placeholder="Ask me a question"
                    submitLabel="Send"
                />
            </div>
        );
    }
}

export default withAuth0(ChatBot);