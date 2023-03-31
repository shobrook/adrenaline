import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

class QueryInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeQuery = this.onChangeQuery.bind(this);
        this.onSubmitQuery = this.onSubmitQuery.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { query: "" };
    }

    /* Event Handlers */

    onChangeQuery(event) {
        this.setState({ query: event.target.value });
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

    /* Lifecycle Methods */

    render() {
        const { query } = this.state;

        return (
            <div id="inputField">
                <div id="inputFieldArea">
                    <textarea
                        id="inputFieldValue"
                        placeholder="Ask a question"
                        onChange={this.onChangeQuery}
                        value={query}
                    />
                    <Button
                        id="sendInputButton"
                        isPrimary
                        onClick={this.onSubmitQuery}
                    >
                        Ask
                    </Button>
                </div>
            </div>
        );
    }
}

export default withAuth0(QueryInput);