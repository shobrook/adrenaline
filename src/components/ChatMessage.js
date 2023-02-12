import { Component } from 'react';

import '../styles/ChatMessage.css';

export default class ChatMessage extends Component {
	render() {
        const { isUserSubmitted, children } = this.props;

		return (
			<div className={`chatMessage ${!isUserSubmitted ? "aiResponse" : ""}`}>
                {children}
            </div>
		);
	}
}
