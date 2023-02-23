import { Component } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import Button from "../components/Button";

import '../styles/ChatMessage.css';

export default class ChatMessage extends Component {
	constructor(props) {
		super(props);

		this.renderMessage = this.renderMessage.bind(this);
		this.renderSuggestChangesButton = this.renderSuggestChangesButton.bind(this);
	}

	/* Utilities */

	renderMessage() {
		const { children } = this.props;

		const messageContent = children.split("```").map((text, index) => {
			// TODO: Remove trailing newlines

			if (index % 2) { // Code block
				return (
					<SyntaxHighlighter language="python" style={dracula}>
						{text.trim()}
					</SyntaxHighlighter>
				);
			}

			return text;
		});

		return (<div className="messageContent">{messageContent}</div>);
	}

	renderSuggestChangesButton() {
		const {
			isUserSubmitted,
			onSuggestChanges,
			waitingForSuggestedChanges,
			children
		} = this.props;
		const containsCode = children.includes("```");

		if (!isUserSubmitted && containsCode) {
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
			)
		}
	}

	/* Lifecycle Methods */

	render() {
		const { isUserSubmitted } = this.props;

		return (
			<div className={`chatMessage ${!isUserSubmitted ? "aiResponse" : ""}`}>
				{this.renderMessage()}
				{this.renderSuggestChangesButton()}
			</div>
		);
	}
}
