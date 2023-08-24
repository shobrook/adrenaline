import React, { Component } from "react";
import { cloneDeep, isEqual } from "lodash";
import Message from "./Message";

export default class Messages extends Component {
    constructor(props) {
        super(props);

        this.onScroll = this.onScroll.bind(this);
    }

    /* Event Handlers */

    onScroll(event) {
        const { messages } = this.props;
        const { scrollTop: scrollPosition } = event.currentTarget;

        if (this.oldScroll > scrollPosition && !messages[messages.length - 1].isComplete) {
            this.disableAutoScroll = true;
        }

        this.oldScroll = scrollPosition;
    }

    /* Lifecycle Methods */

    componentDidUpdate(prevProps) {
        const { messages } = this.props;

        if (messages.length !== prevProps.messages.length) {
            this.disableAutoScroll = false;
        }

        if (!this.disableAutoScroll && !isEqual(messages[messages.length - 1], this.lastMessage)) {
            this.lastMessageElement.scrollIntoView({ behavior: "smooth" });
        }

        this.lastMessage = cloneDeep(messages[messages.length - 1]);
    }

    render() {
        const { messages, repository } = this.props;

        return (
            <>
                <div className="ext-topMessagesShadow" />
                <div className="ext-messages" onScroll={this.onScroll}>
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
                <div className="ext-bottomMessagesShadow" />
            </>
        );
    }
}