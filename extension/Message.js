import React, { Component } from "react";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import MarkdownWithCode from "../components/MarkdownWithCode";
import { isResponseLoading } from "./lib/utilities";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.renderMessage = this.renderMessage.bind(this);
    }

    /* Utilities */

    renderProgress() {
        const { message } = this.props;

        if (message.progressMessage != null) {
            return (
                <div className={`chatMessage ${message.isResponse ? "aiResponse" : ""}`}>
                    <IndeterminateProgressBar key={0} message={message.progressMessage} />
                </div>
            )
        } else if (isResponseLoading(message)) {
            return (
                <div className={`chatMessage ${message.isResponse ? "aiResponse" : ""}`}>
                    <IndeterminateProgressBar key={0} message="Understanding your question" />
                </div>
            )
        }

        return null;
    }

    renderMessage() {
        const { repository, message } = this.props;

        if (isResponseLoading(message)) {
            return null;
        }

        let markdown = isResponseLoading(message) ? 
            message.content.replace(/\[\`[^`]*$|\[\`[^`]+\`\]\([^)]*$/, '')
            : message.content;

        return (
            <div
                className={`ext-chatMessage ${message.isResponse ? "aiResponse" : ""}`}>
                <div className="ext-messageContainer">
                    <MarkdownWithCode
                        repoPath={repository.fullPath}
                        repoSource={repository.source}
                        repoBranch={repository.branch}
                        markdown={markdown}
                        isExtension={true}
                    />
                </div>
            </div>
        );
    }

    /* Lifecycle Methods */

    render() {
        return (
            <div className="chatMessageContainer">
                {this.renderProgress()}
                {this.renderMessage()}
            </div>
        );
    }
}
