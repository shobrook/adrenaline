import { Component } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import InputField from '../components/InputField';
import ChatMessage from '../components/ChatMessage';

import '../styles/ChatBot.css';

export default class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.onSendMessage = this.onSendMessage.bind(this);
        this.onSendSuggestedMessage = this.onSendSuggestedMessage.bind(this);

        this.state = {
            messages: [
                { 
                    isUserSubmitted: false, 
                    message: "Hello! Ask me anything about your project –– I'm here to help." 
                }
            ]
        }
    }

    onSendMessage(message) {
        const { messages } = this.state;

        const context = messages.map(priorMessage => {
            const { isUserSubmitted, message } = priorMessage;

            if (isUserSubmitted) {
                return `Human: ${message}`;
            }

            return `AI: ${message}`;
        }).join("\n");
        this.ws.send(JSON.stringify({ query: message, context  }));
        this.setState({ messages: [...messages, { message, isUserSubmitted: true }] });
    }

    onSendSuggestedMessage() {
        const { preview, prompt } = this.props.suggestedMessage;
        const { messages } = this.state;

        this.ws.send(JSON.stringify({ query: prompt, context: "" }));
        this.setState({ messages: [...messages, { message: preview, isUserSubmitted: true }] });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.ws = new WebSocket("ws://127.0.0.1:5000/generate_chat_response");
        
        this.ws.onopen = event => {
            // const query = localStorage.getItem("prompt");
            // const firstStep = localStorage.getItem("firstStep");

            // const payload = JSON.stringify({ query, step_title: firstStep, prev_step_titles: "" });

            // ws.send(payload);
        };

        this.ws.onmessage = event => {
            const { data } = event;
            const { messages } = this.state;

            const lastMessage = messages[messages.length - 1];
            
            if (!lastMessage.isUserSubmitted) {
                this.setState({ messages: [...messages.splice(0, messages.length - 1), { message: lastMessage.message + data, isUserSubmitted: false }] });
            } else {
                this.setState({ messages: [...messages, { message: data, isUserSubmitted: false }] });
            }
        };
    }

    render() {
        const { messages } = this.state;
        const { suggestedMessage } = this.props;

        return (
            <div id="chatBot">
                <div id="messages">
                    {messages.map(messagePayload => {
                        const { isUserSubmitted, message } = messagePayload;

                        return ( <ChatMessage isUserSubmitted={isUserSubmitted}>{message}</ChatMessage> );
                    })}
                </div>
                <InputField 
                    onSubmit={this.onSendMessage}
                    onSubmitSuggested={this.onSendSuggestedMessage}
                    suggestedMessage={suggestedMessage}
                    placeholder="Ask me a question"
                    submitLabel="Send"
                />
            </div>
        );
    }
}