import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { cloneDeep, isEqual } from "lodash";

import ChatbotHeader from "./ChatbotHeader";

import "./styles/Chatbot.css";

class Message {
    constructor(content, isResponse, isComplete) {
        this.content = content;
        this.isResponse = isResponse;
        this.isComplete = isComplete; // Indicates whether message has finished streaming
        this.progressMessage = null;
    }
}

const IndexingStatus = Object.freeze({
    NotIndexed: "notIndexed",
    FailedToIndex: "failedToIndex",
    IndexedButStale: "indexedButStale",
    Indexed: "indexed"
});

class ChatBot extends Component {
    constructor(props) {
        super(props);

        this.websocketRef = React.createRef();
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

            // Render error message
            if (error != "") {
                toast.error(error, {
                    style: {
                        borderRadius: "7px",
                        background: "#FB4D3D",
                        color: "#fff",
                    },
                    iconTheme: {
                        primary: '#ffffff7a',
                        secondary: '#fff',
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
            toast.error("We are experiencing unusually high load. Please try again at another time.", {
                style: {
                    borderRadius: "7px",
                    background: "#FB4D3D",
                    color: "#fff",
                },
                iconTheme: {
                    primary: '#ffffff7a',
                    secondary: '#fff',
                }
            });
        }
        ws.onclose = event => {
            this.websocketRef.current = null;
        }
    }

    buildWelcomeMessage() {
        const { repository } = this.props;
        const messageContent = `Hi, I’m your AI expert on ${repository.name}. Ask me anything about this codebase.`;
        const welcomeMessage = new Message(messageContent, true, true);
        
        return welcomeMessage;
    }

    getChatHistory(messages) {
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

    /* Event Handlers */

    onChangeIndexingStatus(indexingStatus) {
        this.setState({ indexingStatus });
    }

    onSubmitMessage(message, regenerate = false) {
        const { messages } = this.state;

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
                openWebsocketConnection(ws => {
                    const request = {
                        user_id: user.sub,
                        token: token,
                        codebase_id: codebaseId,
                        query: message,
                        chat_history: getChatHistory(newMessages)
                    };
                    ws.send(JSON.stringify(request));

                    Mixpanel.track("sent_message", { message });
                })
            });
    }

    onClearConversation() {
        Mixpanel.track("clear_conversation");
        this.setState({ messages: [this.buildWelcomeMessage()]});
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { repository } = this.props;
        
        this.setState({isLoading: true});
        getAccessTokenSilently().then(token => {
            fetch(`${process.env.NEXT_PUBLIC_API_URI}api/get_repository`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ repository_id: `github/${repository.fullPath}` })
            }).then(res => res.json()).then(data => {
                const { is_private, is_indexed, num_commits_behind } = data;
                
                if (!is_indexed) { // Not indexed
                    this.setState({indexingStatus: IndexingStatus.NotIndexed});
                } else if (num_commits_behind > 0) { // Indexed but needs reindexing
                    this.setState({indexingStatus: IndexingStatus.IndexedButStale});
                } else {
                    this.setState({indexingStatus: IndexingStatus.Indexed});
                }
    
                // TODO: Prompt user to pay for private repository
            });
        });
    }

    componentDidUpdate(prevProps) {
        const { messages } = this.props;

        if (messages.length !== prevProps.messages.length) {
            this.disableAutoScroll = false;
        }

        if (!this.disableAutoScroll && !isEqual(messages[messages.length - 1], this.lastMessage)) {
            this.lastMessageElement.scrollIntoView({ behavior: "smooth" });
        }

        this.lastMessage = cloneDeep(messages[messages.length - 1]);
    }

    render() {
        const { repository } = this.props;
        const { messages, indexingStatus } = this.state;

        return (
            <div className="chatbotContainer">
                <IndexingStatusNotification 
                    indexingStatus={indexingStatus} 
                    setIndexingStatus={this.onChangeIndexingStatus} 
                />
                <div className={`chatbot ${indexingStatus}`}>
                    <ChatbotHeader repository={repository} />
                    <Messages messages={messages} />
                    <MessageInput onSubmitMessage={this.onSubmitMessage} />
                </div>
            </div>
        )  
    }
}

export default withAuth0(ChatBot);