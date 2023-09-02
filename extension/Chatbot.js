import React, { createRef, Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import Mixpanel from "./lib/mixpanel";
import ChatbotHeader from "./ChatbotHeader";
import Messages from "./Messages";
import MessageInput from "./MessageInput";
import { Message, IndexingStatus } from "./lib/dtos";
import { buildChatHistory, buildWelcomeMessage } from "./lib/utilities";

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.openWebsocketConnection = this.openWebsocketConnection.bind(this);
        this.onSubmitMessage = this.onSubmitMessage.bind(this);
        this.onClearConversation = this.onClearConversation.bind(this);

        this.websocketRef = createRef();
        this.state = { messages: [], isLoading: true }
    }

    /* Utilities */

    openWebsocketConnection(callback) {
        if (this.websocketRef.current != null) {
            callback(this.websocketRef.current);
            return;
        }

        let ws = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}answer_query`);
        ws.onopen = event => {
            this.websocketRef.current = ws;
            callback(ws);
        };
        ws.onmessage = event => {
            if (event.data == "ping") { // Keepalive mechanism
                ws.send("pong");
                return;
            }

            const {
                type,
                data,
                is_finished,
                error
            } = JSON.parse(event.data);

            if (error != "") { // Error message
                this.setState(prevState => {
                    const { messages } = prevState;
                    const priorMessages = messages.slice(0, messages.length - 1);
                    let response = messages[messages.length - 1];
                    response.progressMessage = null;
                    response.content = error;
                    response.isError = true;
                    response.isComplete = true;

                    Mixpanel.track("received_error_response", { error });

                    return {
                        ...prevState,
                        messages: [...priorMessages, response]
                    }
                });
                return;
            }
            
            if (type === "progress") { // Answering progress
                this.setState(prevState => {
                    const { messages } = prevState;
                    const priorMessages = messages.slice(0, messages.length - 1);
                    let lastMessage = messages[messages.length - 1];
                    lastMessage.progressMessage = data;

                    return {
                        ...prevState,
                        messages: [...priorMessages, lastMessage]
                    }
                });
            } else if (type == "answer") { // Answer content
                this.setState(prevState => {
                    const { message } = data;
                    const { messages } = prevState;
                    const priorMessages = messages.slice(0, messages.length - 1);
                    let response = messages[messages.length - 1];

                    response.content = is_finished ? response.content : message;
                    response.isComplete = is_finished;
                    response.progressMessage = null;

                    if (is_finished) {
                        Mixpanel.track("received_response", { response: response.content })
                    }

                    return {
                        ...prevState,
                        messages: [...priorMessages, response]
                    }
                });
            }
        }
        ws.onerror = event => {
            this.websocketRef.current = null;
            callback(null)
        }
        ws.onclose = event => {
            this.websocketRef.current = null;
        }
    }

    /* Event Handlers */

    onSubmitMessage(message, regenerate = false) {
        const { messages } = this.state;
        const { repository } = this.props;
        const { getAccessTokenSilently, user } = this.props.auth0;

        const query = new Message(message, false, true);
        let response = new Message("", true, false); // Initialize response

        let newMessages;
        if (regenerate) {
            let priorMessages = messages.slice(0, messages.length - 1);
            newMessages = [...priorMessages, response];
        } else {
            let priorMessages = messages.slice(0, messages.length);
            newMessages = [...priorMessages, query, response];
        }
        
        this.setState({messages: newMessages}, () => {
            getAccessTokenSilently()
                .then(token => {
                    this.openWebsocketConnection(ws => {
                        if (ws === null) { // Connection could not be established
                            this.setState(prevState => {
                                const { messages } = prevState;
                                const priorMessages = messages.slice(0, messages.length - 1);
                                let response = messages[messages.length - 1];
                                response.progressMessage = null;
                                response.content = "We are currently experiencing high load. Please try again at another time.";
                                response.isError = true;
                                response.isComplete = true;

                                Mixpanel.track("websocket_connection_failed");

                                return {
                                    ...prevState,
                                    messages: [...priorMessages, response]
                                };
                            });
                            return;
                        }

                        const request = {
                            user_id: user.sub,
                            token: token,
                            codebase_id: `github/${repository.fullPath}`,
                            query: message,
                            chat_history: buildChatHistory(newMessages)
                        };
                        ws.send(JSON.stringify(request));

                        Mixpanel.track("sent_message", { message });
                    })
                });
        });
    }

    onClearConversation() {
        Mixpanel.track("clear_conversation");

        this.setState(prevState => {
            const { messages } = prevState;
            return {
                ...prevState,
                messages: [messages[0]]
            }
        });
    }

    /* Lifecycle Methods */
    
    componentDidUpdate(prevProps, prevState) {
        const { repository } = this.props;
        const { messages } = this.state;

        if (messages.every(message => message.isComplete)) {
            localStorage.setItem(repository.fullPath, JSON.stringify(messages));
        }
    }

    componentDidMount() {
        const { repository } = this.props;
        let priorMessages = JSON.parse(localStorage.getItem(repository.fullPath));

        if (priorMessages) {
            this.setState({ messages: priorMessages })
        } else {
            this.setState({ messages: [buildWelcomeMessage(repository.name)] });
        }
    }

    render() {
        const { repository, updateIndexingStatus } = this.props;
        const { messages } = this.state;

        return (
            <div className="ext-chatbotContainer">
                <div className="ext-chatbot">
                    <ChatbotHeader 
                        repository={repository} 
                        updateIndexingStatus={updateIndexingStatus}
                        websocketRef={this.websocketRef}
                    />
                    <div 
                        className={`ext-messagesContainer ${repository.indexingStatus}`} 
                        disabled={repository.indexingStatus !== IndexingStatus.Indexed && repository.indexingStatus !== IndexingStatus.IndexedButStale}
                    >
                        <Messages messages={messages} repository={repository} />
                        <MessageInput 
                            onSubmitMessage={this.onSubmitMessage} 
                            isBlocked={!messages[messages.length - 1]?.isComplete} 
                            onClearConversation={this.onClearConversation}
                        />
                    </div>
                </div>
            </div>
        )  
    }
}

export default withAuth0(ChatBot);