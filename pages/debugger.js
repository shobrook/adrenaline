import React, {useEffect, useRef, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";

import Header from "../containers/Header";
import ChatBot from "../containers/ChatBot";
import CodeExplorer from "../containers/CodeExplorer";
import Spinner from "../components/Spinner";

import Mixpanel from "../library/mixpanel";
import SubscriptionModal from "../containers/SubscriptionModal";
import {Toaster} from "react-hot-toast";
import {useRouter} from "next/router";

const WELCOME_MESSAGE = "I'm here to help you understand your codebase. Get started by importing a Github repository or a code snippet. You can ask me to explain how something works, where something is implemented, or even how to debug an error."

export default function DebuggerAppPage() {
    // create functional state variables using the component state variables from above
    const {isAuthenticated, getAccessTokenSilently, user, isLoading} = useAuth0();
    const [codebaseId, setCodebaseId] = useState("");
    const [messages, setMessages] = useState([new Message(WELCOME_MESSAGE, true, true)]);
    const [chatHistorySummary, setChatHistorySummary] = useState("");
    const [documents, setDocuments] = useState([]);
    const [subscriptionStatus, setSubscriptionStatus] = useState({});
    const [renderSubscriptionModal, setRenderSubscriptionModal] = useState(false);
    const queryWS = useRef(null);
    const prevAuthState = useRef(isAuthenticated);
    const router = useRouter();

    useEffect(() => {
        console.log("router.query", router.query)
    }, [router.query])

    /* Utilities */

    function fetchUserMetadata() {

        /* Handle Github OAuth redirects */

        const {search} = this.props.router.location;

        // TODO: Probably a better way to get query parameters than this
        let githubCode = null;
        if (search !== "") {
            const searchParams = search.split("?code=");
            githubCode = searchParams.length === 2 ? searchParams[1] : null;
        }

        if (githubCode !== null) {
            getAccessTokenSilently()
                .then(token => {
                    fetch("https://adrenaline-api-staging.up.railway.app/api/github_callback", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            user_id: user.sub,
                            github_code: githubCode
                        })
                    })
                        .then(res => res.json())
                        .then(data => {
                            // TODO: Update state to tell CodeExplorer to render the SelectRepository view
                        })
                })
        }

        /* Fetch user's subscription status */

        getAccessTokenSilently()
            .then(token => {
                fetch("https://adrenaline-api-staging.up.railway.app/api/stripe/subscription_status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email !== null ? user.email : ""
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const {
                            plan,
                            num_messages_sent,
                            num_repositories_indexed,
                            num_code_snippets_indexed
                        } = data;

                        setSubscriptionStatus({
                            plan,
                            numMessagesSent: num_messages_sent,
                            numRepositoriesIndexed: num_repositories_indexed,
                            numCodeSnippetsIndexed: num_code_snippets_indexed
                        })
                    });
            });
    }

    function setShowSubscriptionModal(isVisible) {
        setRenderSubscriptionModal(isVisible);
    }

    function onSubmitQuery(message) {
        // TODO: Handle regeneration

        const query = new Message(message, false, true);
        let response = new Message("", true, false);

        if (!isAuthenticated) { // TODO: Display blurred output and prompt user to sign up
            response.content = "You must be signed in to use the chatbot.";
            response.isComplete = true;
        }

        const priorMessages = messages.slice(0, messages.length);
        setMessages([...priorMessages, query, response]);
        localStorage.setItem(codebaseId, JSON.stringify(priorMessages));

        if (!isAuthenticated) {
            return;
        }

        getAccessTokenSilently()
            .then(token => {
                const request = {
                    user_id: user.sub,
                    token: token,
                    codebase_id: codebaseId,
                    query: message,
                    chat_history_summary: chatHistorySummary
                };
                queryWS.current.send(JSON.stringify(request));
                Mixpanel.track("received_chatbot_response", {query: message});
            })
    }

    function onSetCodebaseId(codebaseId) {
        setCodebaseId(codebaseId);
        setMessages(JSON.parse(localStorage.getItem(codebaseId)) || [new Message(WELCOME_MESSAGE, true, true)]);
    }

    /* Helpers */

    function renderApp() {
        return (
            <div className="app">
                <Header setShowSubscriptionModal={setShowSubscriptionModal}/>

                {
                    isLoading ?
                        <div id="loadingBody">
                            <Spinner/>
                        </div>
                        :
                        <div className="body">
                            <ChatBot
                                messages={messages}
                                onSubmitQuery={onSubmitQuery}
                                onUpgradePlan={() => setShowSubscriptionModal(true)}
                            />
                            <CodeExplorer
                                onSetCodebaseId={onSetCodebaseId}
                                codebaseId={codebaseId}
                                onUpgradePlan={() => setShowSubscriptionModal(true)}
                            />
                        </div>
                }
            </div>
        )
    }

    /* Lifecycle Methods */

    useEffect(() => {
        if (isAuthenticated) {
            Mixpanel.identify(user.sub);
            Mixpanel.people.set({email: user.email});
        }

        Mixpanel.track("load_playground");

        // TODO: Only connect to websocket when user is authenticated

        /* Connect to query handler websocket */

        let ws;
        if (window.location.protocol === "https:") {
            ws = new WebSocket(`wss://websocket-lb.useadrenaline.com/answer_query`);
        } else {
            ws = new WebSocket(`wss://websocket-lb.useadrenaline.com/answer_query`);
        }

        ws.onopen = event => {
        }; // QUESTION: Should we wait to render the rest of the site until connection is established?
        ws.onmessage = event => {
            const {
                type,
                data,
                is_final,
                is_paywalled,
                chat_history_summary,
                error_message
            } = JSON.parse(event.data);

            if (type === "code_chunk") {
                const {chunk, file_path, summary} = data;
                const document = new Document(`\`\`\`\n${chunk}\n\`\`\``); // TODO: Use CodeChunk

                setDocuments([...documents, document]);
            } else if (type === "answer") {
                const {message} = data;

                const priorMessages = messages.slice(0, messages.length - 1);
                let response = messages[messages.length - 1];

                if (message.type in response.steps) {
                  response.steps[message.type] += message.content;
                } else {
                  response.steps[message.type] = message.content;
                }

                this.setState({ messages: [...priorMessages, response] });
              } else if (type == "answer") {
                const { message } = data;

                const priorMessages = messages.slice(0, messages.length - 1);
                let response = messages[messages.length - 1];

                response.content += message;
                response.isComplete = is_final;
                response.isPaywalled = is_paywalled;

                setMessages([...priorMessages, response]);
                setChatHistorySummary(chat_history_summary);
            } else if (type === "so_post") {
                const {title, question_body, answer, link} = data;
                const document = new Document(answer); // TODO: Use StackOverflowPost

                setDocuments([...documents, document]);
            }
        }
        ws.onerror = event => {
            console.log(event); // TODO: Display error message
        };
        queryWS.current = ws;

        // fetchUserMetadata();
    }, [])


    useEffect(() => {
        if (prevAuthState.current !== isAuthenticated) {
            // fetchUserMetadata();
        }

        prevAuthState.current = isAuthenticated;
    }, [isAuthenticated])

    return (
        <>
            {renderApp()}
            {renderSubscriptionModal ?
                <div className={"grid p-2 justify-items-center"}>
                    <SubscriptionModal setShowSubscriptionModal={setShowSubscriptionModal}/>
                </div>
                : null
            }
        </>
    );

}


class Message {
    constructor(content, isResponse, isComplete, isPaywalled = false) {
        this.content = content;
        this.isResponse = isResponse;
        this.isComplete = isComplete; // Indicates whether message has finished streaming
        this.isPaywalled = isPaywalled;
        this.steps = {}
    }
}

class Document {
    constructor(content) {
        this.content = content;
    }
}

class CodeChunk {
    constructor(filePath, code, summary) {
        this.filePath = filePath;
        this.code = code;
        this.summary = summary;
    }
}

class StackOverflowPost {
    constructor(title, questionBody, answer, link) {
        this.title = title;
        this.questionBody = questionBody;
        this.answer = answer;
        this.link = link;
    }
}
