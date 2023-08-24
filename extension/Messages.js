import React, { Component } from "react";
import Message from "./Message";

export default class Messages extends Component {
    constructor(props) {
        super(props);

        this.onScroll = this.onScroll.bind(this);
    }

    /* Event Handlers */

    onScroll(event) {
        const { messages } = this.props;
        const { scrollTop: scrollPosition } = e.currentTarget;

        if (this.oldScroll > scrollPosition && !messages[messages.length - 1].isComplete) {
            this.disableAutoScroll = true;
        }

        this.oldScroll = scrollPosition;
    }

    /* Lifecycle Methods */

    render() {
        const { messages, repository } = this.props;

        return (
            <div className="messages" onScroll={this.onScroll}>
                {messages.map((message, index) => {
                    return (
                        <div ref={(el) => {
                            if (index == messages.length - 1) {
                                this.lastMessageElement = el;
                            }
                        }}>
                            <Message 
                                index={index == messages.length - 1 ? -1 : index}
                                message={message} 
                                repository={repository} 
                            />
                        </div>
                    );
                })}
            </div>
        );
    }
}