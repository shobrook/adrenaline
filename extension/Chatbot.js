import React, { createRef, Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Mixpanel from "./lib/mixpanel";
import IndexingStatusNotification from "./IndexingStatusNotification";
import ChatbotHeader from "./ChatbotHeader";
import Messages from "./Messages";
import MessageInput from "./MessageInput";

class Message {
    constructor(content, isResponse, isComplete) {
        this.content = content;
        this.isResponse = isResponse;
        this.isComplete = isComplete; // Indicates whether message has finished streaming
        this.progressMessage = null;
        this.isError = false;
    }
}

const IndexingStatus = Object.freeze({
    NotIndexed: "notIndexed",
    FailedToIndex: "failedToIndex",
    IndexedButStale: "indexedButStale",
    Indexed: "indexed"
});

const buildChatHistory = messages => {
    let startingMessages;
    if (!messages[messages.length - 1].isResponse) {
        startingMessages = messages.slice(0, messages.length - 1);
    } else if (!messages[messages.length - 1].isComplete) {
        startingMessages = messages.slice(0, messages.length - 2);
    } else {
        startingMessages = messages;
    }

    return startingMessages.slice(1).map(message => {
        return {
            content: message.content,
            is_response: message.isResponse,
        }
    });
}

const buildWelcomeMessage = repositoryName => {
    const messageContent = `Hi, I'm your AI expert on ${repositoryName}. Ask me anything about this codebase.`;
    const welcomeMessage = new Message(messageContent, true, true);
    
    return welcomeMessage;
}

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.openWebsocketConnection = this.openWebsocketConnection.bind(this);
        this.onChangeIndexingStatus = this.onChangeIndexingStatus.bind(this);
        this.onSubmitMessage = this.onSubmitMessage.bind(this);
        this.onClearConversation = this.onClearConversation.bind(this);

        this.websocketRef = createRef();
        this.state = {
            messages: [],
            indexingStatus: IndexingStatus.NotIndexed,
            isLoading: true
        }
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

    onChangeIndexingStatus(indexingStatus) {
        this.setState({ indexingStatus });
    }

    onSubmitMessage(message, regenerate = false) {
        const { messages } = this.state;
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
        
        this.setState({messages: newMessages})
    
        getAccessTokenSilently()
            .then(token => {
                this.openWebsocketConnection(ws => {
                    if (ws === null) {
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
                        codebase_id: codebaseId,
                        query: message,
                        chat_history: buildChatHistory(newMessages)
                    };
                    ws.send(JSON.stringify(request));

                    Mixpanel.track("sent_message", { message });
                })
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

    componentDidMount() {
        const { repository } = this.props;
        const { getAccessTokenSilently } = this.props.auth0;

        this.setState({ messages: [buildWelcomeMessage(repository.name)] });
        
        // getAccessTokenSilently().then(token => {
        //     fetch(`${process.env.NEXT_PUBLIC_API_URI}api/get_repository`, {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json",
        //             "Authorization": `Bearer ${token}`
        //         },
        //         body: JSON.stringify({ repository_id: `github/${repository.fullPath}` })
        //     }).then(res => res.json()).then(data => {
        //         const { is_private, is_indexed, num_commits_behind } = data;
                
        //         if (!is_indexed) { // Not indexed
        //             this.setState({indexingStatus: IndexingStatus.NotIndexed});
        //         } else if (num_commits_behind > 0) { // Indexed but needs reindexing
        //             this.setState({indexingStatus: IndexingStatus.IndexedButStale});
        //         } else {
        //             this.setState({indexingStatus: IndexingStatus.Indexed});
        //         }
    
        //         // TODO: Prompt user to pay for private repository
        //     });
        // });
    }

    render() {
        const { repository } = this.props;
        const { messages, indexingStatus } = this.state;

        return (
            <div className="ext-chatbotContainer">
                <IndexingStatusNotification 
                    indexingStatus={indexingStatus} 
                    setIndexingStatus={this.onChangeIndexingStatus} 
                />
                <div className={`ext-chatbot ${indexingStatus}`}>
                    <ChatbotHeader repository={repository} />
                    <Messages messages={messages} repository={repository} />
                    <MessageInput 
                        onSubmitMessage={this.onSubmitMessage} 
                        isBlocked={!messages[messages.length - 1]?.isComplete} 
                    />
                </div>
            </div>
        )  
    }
}

export default withAuth0(ChatBot);