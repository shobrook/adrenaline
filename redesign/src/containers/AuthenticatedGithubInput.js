import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import Button from "../components/Button";

import "../styles/AuthenticatedGithubInput.css";

class AuthenticatedGithubInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onGithubAuthentication = this.onGithubAuthentication.bind(this);

        this.fetchRepositoryOptions = this.fetchRepositoryOptions.bind(this);

        this.state = {
            isGithubAuthenticated: false,
            repositoryOptions: {},
            selectedRepository: ""
        };
    }

    /* Utilities */

    fetchRepositoryOptions() {
        const { isGithubAuthenticated } = this.props;
        const { user, isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (!isAuthenticated) {
            return;
        }

        if (!isGithubAuthenticated) {
            return;
        }

        console.log("yooooo")

        getAccessTokenSilently()
            .then(token => {
                fetch("http://localhost:5050/api/github_repositories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: user.sub })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { is_github_authenticated, repos } = data;

                        if (!is_github_authenticated) {
                            this.setState({ isGithubAuthenticated: false });
                        }

                        const repositoryOptions = repos.reduce((repoObj, repo) => ({ ...repoObj, [repo.name]: repo }), {})
                        this.setState({ isGithubAuthenticated: true, repositoryOptions });

                        console.log(repositoryOptions)
                    })
            });
    }

    /* Event Handlers */

    onGithubAuthentication() {
        const clientId = "fcaf8f61d70e5de447c9";
        // const redirectUri = "https://useadrenaline.com/app";
        const redirectUri = "http://localhost:3000/app";
        // const login = ""; // TODO: Populate this if user is already authenticated with Github
        const scope = "repo";

        let authUrl = "https://github.com/login/oauth/authorize?"
        authUrl += `client_id=${clientId}`;
        authUrl += `&redirect_uri=${redirectUri}`;
        // authUrl += `&login=${login}`;
        authUrl += `&scope=${scope}`;

        const win = window.open(authUrl, "_blank"); // TODO: Open in same tab
        if (win != null) {
            win.focus();
        }
    }

    onChangeRepository(event, newValue) {
        this.setState({ selectedRepository: newValue })
    }

    onSubmitRepository() {
        const { onSetProgressMessage } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;
        const { repositoryOptions, selectedRepository } = this.state;

        if (selectedRepository == "") {
            return;
        }

        getAccessTokenSilently()
            .then(token => {
                const request = {
                    user_id: user.sub,
                    token: token,
                    repo_id: repositoryOptions[selectedRepository].id,
                    refresh_index: true // TEMP
                };
                this.websocket.send(JSON.stringify(request));

                onSetProgressMessage("Scraping repository");
            });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { onSetProgressMessage, onSetCodebase } = this.props;

        this.fetchRepositoryOptions();

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://localhost:5001/index_codebase_by_repo_id`);
        } else {
            this.websocket = new WebSocket(`ws://localhost:5001/index_codebase_by_repo_id`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
            const {
                message,
                metadata,
                is_final,
                is_paywalled,
                error_message
            } = JSON.parse(event.data);

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

    componentDidUpdate(previousProps, previousState) {
        const { isGithubAuthenticated: prevAuthStatus } = previousProps;
        const { isGithubAuthenticated: currAuthStatus } = this.props;

        if (!(!prevAuthStatus && currAuthStatus)) { // Component didn't update due to user authentication
            return;
        }

        this.fetchRepositoryOptions();
    }

    render() {
        const { selectedRepository, repositoryOptions, isGithubAuthenticated } = this.state;

        if (isGithubAuthenticated) {
            return (
                <div id="inputField" className="githubInput">
                    <Autocomplete
                        value={selectedRepository}
                        onChange={this.onChangeRepository}
                        options={Object.keys(repositoryOptions)}
                        sx={{ width: 300 }}
                        renderInput={(params) => <TextField {...params} />}
                    />
                    <Button isPrimary onClick={this.onSetPrivateRepository}>Add</Button>
                </div>
            );
        }

        return (
            <a id="" onClick={this.onGithubAuthentication}>
                Authenticate with Github
            </a>
        );
    }
}

export default withAuth0(AuthenticatedGithubInput);