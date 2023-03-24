import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";

import Button from "../components/Button";

import "../styles/GithubInput.css";

class GithubInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeGithubUrl = this.onChangeGithubUrl.bind(this);
        this.onSubmitGithubUrl = this.onSubmitGithubUrl.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { githubUrl: "" };
    }

    /* Event Handlers */

    onChangeGithubUrl(event) {
        this.setState({ githubUrl: event.target.value });
    }

    onSubmitGithubUrl() {
        const { onSetProgressMessage } = this.props;
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
                    repo_url: githubUrl,
                    refresh_index: true // TEMP
                };
                this.websocket.send(JSON.stringify(request));

                onSetProgressMessage("Scraping repository");
            });
    }

    onKeyPress(event) {
        const code = event.keyCode || event.which;

        if (code === 13) {
            this.onSubmitGithubUrl();
        }
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { onSetCodebase, onSetProgressMessage } = this.props;

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://localhost:5001/index_codebase`);
        } else {
            this.websocket = new WebSocket(`ws://localhost:5001/index_codebase`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
            const { githubUrl } = this.state;
            const {
                message,
                metadata,
                is_final,
                is_paywalled,
                error_message
            } = JSON.parse(event.data);

            console.log(event.data);

            // TODO: Error-handling

            if (is_final) {
                onSetProgressMessage("");

                if (is_paywalled) {
                    await onSetCodebase("", [], is_paywalled);
                } else {
                    const { codebase_id, files } = metadata;
                    await onSetCodebase(codebase_id, files, is_paywalled);
                }
            } else {
                onSetProgressMessage(message);
            }
        }
        this.websocket.onerror = event => { };
    }

    render() {
        const { githubUrl } = this.state;

        return (
            <div id="inputField" className="githubInput">
                <div id="inputFieldArea">
                    <input
                        id="inputFieldValue"
                        placeholder="Github repository link"
                        onChange={this.onChangeGithubUrl}
                        value={githubUrl}
                        onKeyPress={this.onKeyPress}
                    />
                    <Button
                        id="sendInputButton"
                        isPrimary
                        onClick={this.onSubmitGithubUrl}
                    >
                        Add
                    </Button>
                </div>
            </div>
        );
    }
}

export default withAuth0(GithubInput);