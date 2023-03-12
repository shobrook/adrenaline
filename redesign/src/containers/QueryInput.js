import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";

import Button from "../components/Button";

import "../styles/QueryInput.css";

class QueryInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeGithubUrl = this.onChangeGithubUrl.bind(this);
        this.onChangeQuery = this.onChangeQuery.bind(this);
        this.onSubmitGithubUrl = this.onSubmitGithubUrl.bind(this);
        this.onSubmitQuery = this.onSubmitQuery.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { githubUrl: "", query: "", fileBeingProcessed: "" };
    }

    /* Event Handlers */

    onChangeGithubUrl(event) {
        this.setState({ githubUrl: event.target.value });
    }

    onChangeQuery(event) {
        this.setState({ query: event.target.value });
    }

    onSubmitGithubUrl() {
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;
        const { githubUrl } = this.state;

        if (githubUrl == "") {
            return;
        }

        if (!isAuthenticated) {
            loginWithRedirect({
                appState: {
                    returnTo: window.location.pathname
                }
            });
            return;
        }

        getAccessTokenSilently()
            .then(token => {
                const request = {
                    user_id: user.sub,
                    token: token,
                    github_url: githubUrl,
                    refresh: false // TEMP
                };
                this.websocket.send(JSON.stringify(request));
            });
    }

    onSubmitQuery() {
        const { query } = this.state;

        if (query == "") {
            return;
        }

        this.props.onSubmitQuery(query);
    }

    onKeyPress(event, callback) {
        const code = event.keyCode || event.which;

        if (code === 13) {
            callback();
        }
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { onSetCodebaseId } = this.props;

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://localhost:5001/index_codebase`);
        } else {
            this.websocket = new WebSocket(`ws://localhost:5001/index_codebase`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = event => {
            const { file, codebase_id, is_final } = JSON.parse(event.data);

            if (is_final) {
                this.setState({ "fileBeingProcessed": "" });
                onSetCodebaseId(codebase_id);
            } else {
                this.setState({ "fileBeingProcessed": file });
            }
        }
        this.websocket.onerror = event => { };
    }

    render() {
        const { query, githubUrl, fileBeingProcessed } = this.state;

        return (
            <div id="inputField">
                <div id="inputFieldArea">
                    <input
                        id="inputFieldValue"
                        placeholder="Github repository link"
                        onChange={this.onChangeGithubUrl}
                        value={githubUrl}
                        onKeyPress={() => this.onKeyPress(this.onSubmitGithubUrl)}
                    />
                    <Button
                        id="sendInputButton"
                        isPrimary
                        onClick={this.onSubmitGithubUrl}
                    >
                        Ask
                    </Button>
                </div>

                {fileBeingProcessed != "" ?
                    (<div id="indexProgress">{`Processed: ${fileBeingProcessed}`}</div>)
                    : null}

                <div id="inputFieldArea">
                    <input
                        id="inputFieldValue"
                        placeholder="Ask a question"
                        onChange={this.onChangeQuery}
                        value={query}
                        onKeyPress={() => this.onKeyPress(this.onSubmitQuery)}
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