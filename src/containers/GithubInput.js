import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import toast from "react-hot-toast";

import Button from "../components/Button";
import { Repository } from "../library/data";

import "../styles/GithubInput.css";

class GithubInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeGithubUrl = this.onChangeGithubUrl.bind(this);
        this.onSubmitGithubUrl = this.onSubmitGithubUrl.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { githubUrl: "", secondaryIndexingProgressId: null };
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
                    refresh_index: false // TEMP
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
        const {
            onSetCodebase,
            onSetProgressMessage
        } = this.props;

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://${process.env.WEBSOCKET_URL}index_codebase_by_repo_url`);
        } else {
            this.websocket = new WebSocket(`ws://${process.env.WEBSOCKET_URL}index_codebase_by_repo_url`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
            const { secondaryIndexingProgressId } = this.state;
            const {
                message,
                metadata,
                is_final,
                is_paywalled,
                is_fast,
                error_message
            } = JSON.parse(event.data);

            if (error_message != "") {
                toast.error(error_message, {
                    style: {
                        borderRadius: "7px",
                        background: "#FB4D3D",
                        color: "#fff",
                    },
                    iconTheme: {
                        primary: '#ffffff7a',
                        secondary: '#fff',
                    }
                });
                onSetProgressMessage("", true);
                return;
            }

            if (is_fast) {
                if (is_final) {
                    onSetProgressMessage("");

                    if (is_paywalled) {
                        const repository = new Repository("", "", {});
                        await onSetCodebase(repository, is_paywalled);
                    } else {
                        const { codebase_id, name, files } = metadata;
                        const repository = new Repository(codebase_id, name, files);
                        await onSetCodebase(repository, is_paywalled);

                        const toastId = toast.loading("Fine-tuning chatbot on your code. Output will continuously improve until complete.");
                        this.setState({ secondaryIndexingProgressId: toastId });
                    }
                } else {
                    onSetProgressMessage(message);
                }
            } else if (is_final) {
                toast.dismiss(secondaryIndexingProgressId);
                toast.success("Fine-tuning complete. Chatbot is fully optimized.", { id: secondaryIndexingProgressId });
            }
        }
        this.websocket.onerror = event => { };
    }

    render() {
        const { githubUrl, secondaryIndexingProgressId, } = this.state;

        return (
            <>
                <div id="inputField" className="githubInput">
                    <div id="inputFieldArea">
                        <img id={githubUrl == "" ? "passiveLink" : "activeLink"} src="./link_icon.png" />
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
            </>
        );
    }
}

export default withAuth0(GithubInput);