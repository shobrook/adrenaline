import { Component } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FaRegFileAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { HiRefresh } from "react-icons/hi";

import PaywallMessage from "./PaywallMessage";
import ProgressBar from "../components/ProgressBar";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.onToggleContext = this.onToggleContext.bind(this);
        // this.onToggleLearnMore = this.onToggleLearnMore.bind(this);

        this.isLoading = this.isLoading.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.renderLoadingSteps = this.renderLoadingSteps.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderOptions = this.renderOptions.bind(this);
        this.renderContext = this.renderContext.bind(this);

        this.state = {
            renderContext: false,
            renderLearnMore: false
        };
    }

    /* Event Handlers */

    onToggleContext() {
        const { isLastMessage } = this.props;
        const { renderContext } = this.state;

        this.setState({ renderContext: !renderContext, renderLearnMore: false });

    }

    // onToggleLearnMore() {
    //     const { renderLearnMore, isLastMessage } = this.state;

    //     this.setState({ renderLearnMore: !renderLearnMore, renderContext: false });

    //     if (!renderLearnMore && isLastMessage) {
    //         this.scrollToBottom();
    //     }
    // }

    /* Utilities */

    isLoading() {
        const { isResponse, children, isComplete } = this.props;
        return isResponse && children == "" && !isComplete;
    }

    renderOptions() {
        const {
            isFirstMessage,
            isResponse,
            isComplete,
            isLastMessage,
            onRegenerateAnswer,
            sources
        } = this.props;
        const { renderContext, renderLearnMore } = this.state;

        if (!isResponse || this.isLoading() || isFirstMessage || !isComplete) {
            return;
        }

        return (
            <div className="responseOptions">
                {
                    sources.length > 0 && (
                        <div
                            className={`optionButton ${renderContext ? "isClicked" : ""}`}
                            onClick={this.onToggleContext}
                        >
                            Sources
                        </div>
                    )
                }
                {
                    isLastMessage ? (
                        <div
                            className="regenerateAnswer"
                            onClick={onRegenerateAnswer}
                        >
                            <HiRefresh size={22} />
                        </div>
                    ) : <div />
                }
                {/* <div
                    className={`optionButton ${renderLearnMore ? "isClicked" : ""}`}
                    onClick={this.onToggleLearnMore}
                >
                    Learn more
                </div> */}
            </div>
        );
    }

    renderMessage() {
        const { children } = this.props;

        const messageContent = children.split("```").map((text, index) => {
            // TODO: Remove trailing newlines

            if (index % 2) { // Code block
                let codeLines = text.split('\n');
                let programmingLanguage = 'text';

                if (codeLines[0].match(/^[a-zA-Z]+$/)) {
                    programmingLanguage = codeLines.shift();
                }
                codeLines = codeLines.join('\n');

                return (
                    <SyntaxHighlighter
                        className="codeBlock"
                        language={programmingLanguage}
                        style={dracula}
                        showLineNumbers={true}
                    >
                        {codeLines.trim()}
                    </SyntaxHighlighter>
                );
            }

            return (
                <pre className={"plainText"}>{
                    text.split("`").map((otherText, otherIndex) => {
                        if (otherIndex % 2) { // In-line code
                            return (<b>{`\`${otherText}\``}</b>);
                        }

                        return otherText.replace(/^\n/, "")
                    })
                }</pre>
            );
        });
        return (<div className="messageContent">{messageContent}</div>);
    }

    renderPaywall() {
        const { isPaywalled, isComplete, onUpgradePlan } = this.props;

        if (isPaywalled && isComplete) {
            return (
                <PaywallMessage onUpgradePlan={onUpgradePlan} />
            );
        }
    }

    renderLoadingSteps() {
        const { loadingSteps } = this.props;

        return loadingSteps.map(loadingStep => {
            const { type, content } = loadingStep;

            if (type.toLowerCase() == "progress") {
                return null;
            }

            return (
                <div className="reasoningStep">
                    <span className="stepType">{type}:</span> <span className="stepContent">{content}</span>
                </div>
            );
        });
    }

    renderContext() {
        const { renderContext } = this.state;
        const { sources, setFileContext } = this.props;

        if (!renderContext) {
            return null;
        }

        const filePaths = sources.map(source => {
            const { filePath } = source;

            return (
                <span className="contextSource" onClick={() => setFileContext(filePath)}>
                    <FaRegFileAlt fill="white" size={16} /> {filePath}
                </span>
            )
        });

        return (
            <motion.div
                initial={{ translateY: -50, opacity: 0.0 }}
                animate={{ translateY: 0, opacity: 1.0 }}
                exit={{ translateY: -50, opacity: 0.0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="optionsDisplay"
            >
                {filePaths}
            </motion.div>
        );
    }

    /* Lifecycle Methods */

    render() {
        const { isResponse, isPaywalled, progress } = this.props;
        const isLoading = this.isLoading();

        return (
            <>
                <div className="chatMessageContainer">
                    {this.renderLoadingSteps()}
                    {
                        progress != null ? (
                            <div className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""}`}>
                                <ProgressBar key={0} step="Generating response" value={progress} />
                            </div>
                        ) : (
                            <>
                                <div
                                    className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""} ${isLoading ? "loadingMessage" : ""}`}>
                                    {this.renderPaywall()}
                                    <div className={`messageContainer ${isPaywalled ? "blocked" : ""}`}>
                                        {this.renderMessage()}
                                    </div>
                                    {this.renderOptions()}
                                </div>
                                <AnimatePresence>{this.renderContext()}</AnimatePresence>
                            </>
                        )
                    }
                </div>
            </>
        );
    }
}
