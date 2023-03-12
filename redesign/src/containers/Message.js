import { Component } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

import RateLimitMessage from "./RateLimitMessage";

import "../styles/Message.css";

export default class Message extends Component {
	constructor(props) {
		super(props);

		this.renderMessage = this.renderMessage.bind(this);
	}

	/* Utilities */

	renderMessage() {
		const { children } = this.props;

		const messageContent = children.split("```").map((text, index) => {
			// TODO: Remove trailing newlines
			// TODO: Language is hardcoded as Python right now –– pass it in from parent component

			if (index % 2) { // Code block
				return (
					<SyntaxHighlighter className="codeBlock" language="python" style={dracula}>
						{text.trim()}
					</SyntaxHighlighter>
				);
			}

			return text.split("`").map((otherText, otherIndex) => {
				if (otherIndex % 2) { // In-line code
					return (<b>{`\`${otherText}\``}</b>);
				}

				return otherText;
			});
		});

		return (<div className="messageContent">{messageContent}</div>);
	}

	renderPaywall() {
		const { isPaywalled, isComplete } = this.props;

		if (isPaywalled && isComplete) {
			return (
				<RateLimitMessage />
			);
		}
	}

	/* Lifecycle Methods */

	render() {
		const { isResponse, isPaywalled } = this.props;

		return (
			<div className={`chatMessage ${isResponse ? "aiResponse" : ""} ${isPaywalled ? "blockedMessage" : ""}`}>
				{this.renderPaywall()}
				<div className={`messageContainer ${isPaywalled ? "blocked" : ""}`}>
					{this.renderMessage()}
				</div>
			</div>
		);
	}
}
