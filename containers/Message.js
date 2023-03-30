import { Component } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

import PaywallMessage from "./PaywallMessage";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.renderMessage = this.renderMessage.bind(this);
        this.renderReasoningSteps = this.renderReasoningSteps.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
    }

    /* Utilities */

    renderMessage() {
        const { children } = this.props;

        const messageContent = children.split("```").map((text, index) => {
            // TODO: Remove trailing newlines
            // TODO: Language is hardcoded as Python right now –– pass it in from parent component

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

    renderReasoningSteps() {
        const { steps } = this.props;

        console.log(steps);

        return Object.keys(steps).map(stepType => (
            <div className="reasoningStep">
                <span className="stepType">{stepType}:</span> <span className="stepContent">{steps[stepType]}</span>
            </div>
        ));
    }

    /* Lifecycle Methods */

    render() {
        const { isResponse, isPaywalled, isComplete, children } = this.props;
        const isLoading = isResponse && children == "" && !isComplete;

        return (
            <div className="chatMessageContainer">
                {this.renderReasoningSteps()}
                <div
                    className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""} ${isLoading ? "loadingMessage" : ""}`}>
                    {this.renderPaywall()}
                    <div className={`messageContainer ${isPaywalled ? "blocked" : ""}`}>
                        {this.renderMessage()}
                    </div>
                </div>
            </div>
        );
    }
}
