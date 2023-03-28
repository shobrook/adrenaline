import {Component} from "react";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";

import PaywallMessage from "./PaywallMessage";

import "../styles/Message.css";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.renderMessage = this.renderMessage.bind(this);
    }

    /* Utilities */

    renderMessage() {
        const {children} = this.props;

        console.log(children.split("```"))
        const messageContent = children.split("```").map((text, index) => {
            if (index % 2) { // Code block
                let codeLines = text.split('\n');
                let programmingLanguage = 'text';

                if (codeLines[0].match(/^[a-zA-Z]+$/)) {
                    programmingLanguage = codeLines.shift();
                }
                codeLines = codeLines.join('\n');

                return (
                    <SyntaxHighlighter className="codeBlock" language={programmingLanguage} style={dracula}>
                        {codeLines.trim()}
                    </SyntaxHighlighter>
                );
            }

            return <pre className={"plainText"}>{
                text.split("`").map((otherText, otherIndex) => {
                    if (otherIndex % 2) { // In-line code
                        return (<b>{`\`${otherText}\``}</b>);
                    }

                    return otherText.replace(/^\n/, "")
                })
                }</pre>
        });

        return (<div className="messageContent">{messageContent}</div>);
    }

    renderPaywall() {
        const {isPaywalled, isComplete, onUpgradePlan} = this.props;

        if (isPaywalled && isComplete) {
            return (
                <PaywallMessage onUpgradePlan={onUpgradePlan}/>
            );
        }
    }

    /* Lifecycle Methods */

    render() {
        const {isResponse, isPaywalled, isComplete, children} = this.props;
        const isLoading = isResponse && children == "" && !isComplete;

        return (
            <div
                className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""} ${isLoading ? "loadingMessage" : ""}`}>
                {this.renderPaywall()}
                <div className={`messageContainer ${isPaywalled ? "blocked" : ""}`}>
                    {this.renderMessage()}
                </div>
            </div>
        );
    }
}
