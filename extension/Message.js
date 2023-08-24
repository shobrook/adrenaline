import React, { Component } from "react";
import IndeterminateProgressBar from "../components/IndeterminateProgressBar";
import MarkdownWithCode from "../components/MarkdownWithCode";

export default class Message extends Component {
    constructor(props) {
        super(props);

        this.isLoading = this.isLoading.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
    }

    /* Utilities */

    isLoading() {
        const { message } = this.props;
        return message.isResponse && message.content == "" && !message.isComplete;
    }

    renderProgress() {
        const { message } = this.props;

        if (message.progressMessage != null) {
            return (
                <div className={`chatMessage ${message.isResponse ? "aiResponse" : ""}`}>
                    <IndeterminateProgressBar key={0} message={message.progressMessage} />
                </div>
            )
        } else if (this.isLoading()) {
            return (
                <div className={`chatMessage ${message.isResponse ? "aiResponse" : ""}`}>
                    <IndeterminateProgressBar key={0} message="<span>Sending message</span>" />
                </div>
            )
        }

        return null;
    }

    renderMessage() {
        const { repository, message } = this.props;
        const isLoading = this.isLoading();

        if (isLoading) {
            return null;
        }

        let markdown = isLoading ? 
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
