import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import React from 'react';
import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

class QueryInput extends Component {
    constructor(props) {
        super(props);
        this.onChangeQuery = this.onChangeQuery.bind(this);
        this.onSubmitQuery = this.onSubmitQuery.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = {
            query: "",
            rows: 1,
        };
        this.textAreaRef = React.createRef();
    }

    onChangeQuery(event) {
        const { minRows } = this.props;
        const textareaLineHeight = 24;
        const previousRows = event.target.rows;
        event.target.rows = minRows || 1;

        const currentRows = ~~(event.target.scrollHeight / textareaLineHeight);

        if (currentRows === previousRows) {
            event.target.rows = currentRows;
        }

        this.setState({
            query: event.target.value,
            rows: currentRows,
        });
    }

    onSubmitQuery() {
        const { query } = this.state;

        if (query === "") {
            return;
        }

        this.props.onSubmitQuery(query);
        this.setState({ query: "" });
    }

    onKeyPress(event) {
        const code = event.keyCode || event.which;
        if (code === 13) {
            this.onSubmitQuery();
        }
    }

    handleKeyDown = (event) => {
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const previousRows = textarea.rows;
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxRows = Math.floor(textarea.clientHeight / lineHeight);
        const currentRows = ~~(textarea.scrollHeight / lineHeight);

        if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();
            textarea.value = value.substring(0, start) + "\n" + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            textarea.selectionStart = textarea.selectionEnd + 1;
            textarea.scrollTop = textarea.scrollHeight;
            textarea.style.height = textarea.scrollHeight + 'px';
            if (currentRows >= maxRows) {
                textarea.scrollTop = textarea.scrollHeight;
            }

        } else if (event.key === "Backspace" && event.target.value === "" && previousRows > 1) {
            event.preventDefault();
            const textarea = event.target;
            textarea.value = '';
            textarea.rows = 1;
            textarea.selectionStart = textarea.selectionEnd + 1;
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.rows = currentRows;
            this.setState({ rows: 1 });
        } else {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
            if (currentRows < maxRows) {
                textarea.rows = currentRows;
                this.setState({ rows: currentRows });
            }
        }
    };

    render() {
        const { query, rows } = this.state;

        return (
            <div className="chatContainer">
            <form className="chatForm" onSubmit={this.onSubmitQuery}>
                <div id="chatInputContainer">
                    <textarea
                        ref={this.textAreaRef}
                        value={query}
                        rows={rows}
                        onChange={this.onChangeQuery}
                        onKeyDown={this.handleKeyDown}
                        className="chatTextarea"
                        placeholder="Ask a question"
                    />
                    <Button
                        id="chatSubmitButton"
                        isPrimary
                        onClick={this.onSubmitQuery}
                        type="submit"
                    >
                        Ask
                    </Button>
                </div>
            </form>
            </div>
        );
    }
}

export default withAuth0(QueryInput);