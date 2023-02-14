import { Component } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import '../styles/ChatMessage.css';

export default class ChatMessage extends Component {
	constructor(props) {
		super(props);

		this.renderMessage = this.renderMessage.bind(this);
	}

	renderMessage() {
		const { children } = this.props;

		return children.split("```").map((text, index) => {
			if (index % 2) { // Code block
				return (
					<SyntaxHighlighter language="python" style={dracula}>
						{text}
					</SyntaxHighlighter>
				);
			}

			return text;
		});
	}

	render() {
        const { isUserSubmitted } = this.props;

		return (
			<div className={`chatMessage ${!isUserSubmitted ? "aiResponse" : ""}`}>
                {this.renderMessage()}
            </div>
		);
	}
}
