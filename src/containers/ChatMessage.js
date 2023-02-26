import { Component } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import Button from "../components/Button";
import RateLimitMessage from "./RateLimitMessage";

import '../styles/ChatMessage.css';

export default class ChatMessage extends Component {
	constructor(props) {
		super(props);

		this.renderMessage = this.renderMessage.bind(this);
		this.renderSuggestChangesButton = this.renderSuggestChangesButton.bind(this);
		this.renderRegenerateButton = this.renderRegenerateButton.bind(this);
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

	renderSuggestChangesButton() {
		const {
			isUserSubmitted,
			onSuggestChanges,
			waitingForSuggestedChanges,
			children,
			isComplete
		} = this.props;
		const containsCode = children.includes("```"); // QUESTION: What about in-line code?

		if (!isUserSubmitted && isComplete && containsCode) {
			return (
				<Button
					className="suggestChangesButton"
					onClick={() => onSuggestChanges(children)}
					isLoading={waitingForSuggestedChanges}
					isPrimary
				>
					<img src="./integrate_icon.png" />
					Suggest changes
				</Button>
			);
		}
	}

	renderRegenerateButton() {
		const { isComplete, isLastMessage, isUserSubmitted, onRegenerateResponse } = this.props;

		if (!isUserSubmitted && isComplete && isLastMessage) {
			return (
				<div id="regenerateResponse" onClick={onRegenerateResponse}>
					<img src="./regenerate_icon.png" />
				</div>
			);
		}
	}

	renderPaywall() {
		const { isBlocked, isComplete } = this.props;

		if (isBlocked && isComplete) {
			return (
				<RateLimitMessage />
			);
		}
	}

	/* Lifecycle Methods */

	render() {
		const { isUserSubmitted, isComplete, isBlocked, onUpgradePlan, children } = this.props;
		const containsCode = children.includes("```");
		const shouldRenderSuggestChanges = !isUserSubmitted && isComplete && containsCode;

		return (
			<div className={`chatMessage ${!isUserSubmitted ? "aiResponse" : ""} ${isBlocked ? "blockedMessage" : ""}`}>
				{this.renderPaywall()}
				<div className={`messageContainer ${isBlocked ? "blocked" : ""}`}>
					{this.renderMessage()}
					{shouldRenderSuggestChanges ? (
						<div className="chatMessageOptions">
							{this.renderSuggestChangesButton()}
							{this.renderRegenerateButton()}
						</div>
					) : this.renderRegenerateButton()}
				</div>
			</div>
		);
	}
}
