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
        this.renderResponseWordByWord = this.renderResponseWordByWord.bind(this);

        this.state = { messages: [{ message: "I'm an AI trained to help you debug your code. Ask me anything!", isUserSubmitted: false, isComplete: false, isBlocked: false }] };
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

    renderResponseWordByWord(response, isRateLimitError) {
        response.split().forEach((word, index) => {
            const { messages } = this.state;

            let newMessage;
            if (index == 0) { // First word, initialize new message in state
                newMessage = {
                    message: word,
                    isUserSubmitted: false,
                    isComplete: false,
                    isBlocked: isRateLimitError
                };
            } else {
                newMessage = {
                    message: `${messages[messages.length - 1].message} ${word}`,
                    isUserSubmitted: false,
                    isComplete: false,
                    isBlocked: isRateLimitError
                }
            }

            if (messages.length == 0) {
                this.setState({ messages: [newMessage] })
                return;
            } else {
                this.setState({ messages: [...messages.splice(0, messages.length - 1), newMessage] });
            }
        });

        const { messages } = this.state;
        const newMessage = {
            message: messages[messages.length - 1],
            isUserSubmitted: false,
            isComplete: true,
            isBlocked: isRateLimitError
        }
        this.setState({ messages: [...messages.splice(0, messages.length - 1), newMessage] });
    }

    /* Event Handlers */

    onSendMessage(message, isRegeneration = false) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { code, errorMessage, shouldUpdateContext, setCachedDocumentIds } = this.props;
        let { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        if (!isAuthenticated) {
            this.setState({ messages: [...messages, { message, isUserSubmitted: true, isComplete: true }, { message: "You must be logged in to use the chatbot.", isUserSubmitted: false, isComplete: false }] });
            return;
        } else if (!isRegeneration) {
            this.setState({ messages: [...messages, { message, isUserSubmitted: true, isComplete: true }, { message: "...", isUserSubmitted: false, isComplete: false, isLoading: true }] });
        } else {
            this.setState({ messages: [...messages.slice(0, messages.length - 1), { message: "...", isUserSubmitted: false, isComplete: false, isLoading: true }] });
        }

        getAccessTokenSilently()
            .then(token => {
                fetch("https://staging-rubrick-api-production.up.railway.app/api/generate_chat_response", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email,
                        code: code,
                        query: message,
                        chat_history: this.consolidateChatHistory(),
                        is_demo_code: code == DEMO_CODE.join("\n"),
                        cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                        should_update_context: shouldUpdateContext,
                        error_message: errorMessage,
                        is_suggested: false
                    })
                })
                .then(data => {
                    const { messages } = this.state;
                    const message = "Sorry, this might take a while.. we are under a very heavy load right now. Come chat with us in the discord, in the meantime! -->";

                    // this.renderResponseWordByWord(message, is_rate_limit_error);
                    this.setState({ messages: [...messages.slice(0, messages.length - 1), { message, isUserSubmitted: false, isComplete: true, isBlocked: false }] })
                })
                .catch(error => {
                    console.log(error);
                });
                /*
                .then(res => {res.json();
                    console.log(res)})
                .then(data => {
                    const { messages } = this.state;
                    const { message, document_ids, is_rate_limit_error } = data;
                    // this.renderResponseWordByWord(message, is_rate_limit_error);
                    this.setState({ messages: [...messages.slice(0, messages.length - 1), { message, isUserSubmitted: false, isComplete: true, isBlocked: is_rate_limit_error }] })

                    if (shouldUpdateContext) {
                        setCachedDocumentIds(document_ids);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
                */
            })
    }

    onSendSuggestedMessage(message) {
        const { isAuthenticated, getAccessTokenSilently, user } = this.props.auth0;
        const { resetSuggestedMessages, code, errorMessage, shouldUpdateContext, setCachedDocumentIds } = this.props;
        const { preview, prompt } = message;
        const { messages } = this.state;
        const cachedDocumentIds = localStorage.getItem("cachedDocumentIds");

        if (!isAuthenticated) {
            this.setState({ messages: [...messages, { message, isUserSubmitted: true, isComplete: true }, { message: "You must be logged in to use the chatbot.", isUserSubmitted: false, isComplete: false }] });
            return;
        } else {
            this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true, isComplete: true }, { message: "...", isUserSubmitted: false, isComplete: false, isLoading: true }] });
            resetSuggestedMessages();
        }

        getAccessTokenSilently()
            .then(token => {
                fetch("https://staging-rubrick-api-production.up.railway.app/api/generate_chat_response", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email,
                        code: code,
                        query: prompt,
                        chat_history: this.consolidateChatHistory(),
                        is_demo_code: code == DEMO_CODE.join("\n"),
                        cached_document_ids: JSON.parse(cachedDocumentIds) ?? [],
                        should_update_context: shouldUpdateContext,
                        error_message: errorMessage,
                        is_suggested: true
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { messages } = this.state;
                        const { message, document_ids, is_rate_limit_error } = data;
                        // this.renderResponseWordByWord(message, is_rate_limit_error);
                        this.setState({ messages: [...messages.slice(0, messages.length - 1), { message, isUserSubmitted: false, isComplete: true, isBlocked: is_rate_limit_error }] })

                        if (shouldUpdateContext) {
                            setCachedDocumentIds(document_ids);
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
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
                    onUpgradePlan={onUpgradePlan}
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