import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import toast from "react-hot-toast";

import Spinner from "../components/Spinner";
import Button from "../components/Button";
import { Repository } from "../library/data";
import Mixpanel from "../library/mixpanel";

class AuthenticatedGithubInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onSelectRepository = this.onSelectRepository.bind(this);
        this.onChangeSearchInput = this.onChangeSearchInput.bind(this);
        this.onGithubAuthentication = this.onGithubAuthentication.bind(this);

        this.renderSearchBar = this.renderSearchBar.bind(this);

        this.fetchRepositoryOptions = this.fetchRepositoryOptions.bind(this);
        this.groupRepositoriesByOwner = this.groupRepositoriesByOwner.bind(this);

        this.state = {
            isGithubAuthenticated: false,
            repositoryOptions: {},
            selectedRepository: "",
            searchInput: "",
            isLoading: false
        };
    }

    /* Utilities */

    fetchRepositoryOptions() {
        const { user, isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (!isAuthenticated) {
            return; // TODO: Prompt user to login? Or is this condition not possible
        }

        this.setState({ isLoading: true });
        getAccessTokenSilently()
            .then(token => {
                fetch("https://adrenaline-api-staging.up.railway.app/api/github_repositories", {
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

                        console.log(data);

                        if (!is_github_authenticated) {
                            this.setState({
                                isGithubAuthenticated: false,
                                isLoading: false
                            });
                            return;
                        }

                        // const repositoryOptions = repos.reduce((options, repo) => ({ ...options, [repo.name]: repo }), {})
                        const repositoryOptions = repos;
                        this.setState({
                            isGithubAuthenticated: true,
                            isLoading: false,
                            repositoryOptions
                        });
                    })
                    .catch(error => console.log(error));
            });
    }

    groupRepositoriesByOwner() {
        const { repositoryOptions } = this.state;

        console.log(repositoryOptions);

        const groupedRepositories = repositoryOptions.reduce((r, a) => {
            r[a.owner] = r[a.owner] || [];
            r[a.owner].push(a);

            return r;
        }, Object.create(null));

        console.log(groupedRepositories);

        return groupedRepositories;
    }

    /* Event Handlers */

    onGithubAuthentication() {
        const clientId = "fcaf8f61d70e5de447c9";
        const redirectUri = "https://useadrenaline.com/app";
        // const redirectUri = "http://localhost:3000/debugger";
        // const login = ""; // TODO: Populate this if user is already authenticated with Github
        const scope = "read:project";

        let authUrl = "https://github.com/login/oauth/authorize?"
        authUrl += `client_id=${clientId}`;
        authUrl += `&redirect_uri=${redirectUri}`;
        // authUrl += `&login=${login}`;
        authUrl += `&scope=${scope}`;

        const win = window.open(authUrl, "_blank"); // TODO: Open in same tab
        if (win != null) {
            win.focus();
        }
        Mixpanel.track("Connect to github")
    }

    onChangeSearchInput(event) {
        this.setState({ searchInput: event.target.value });
    }

    onChangeRepository(event, newValue) {
        this.setState({ selectedRepository: newValue })
    }

    onSelectRepository(repo) {
        console.log("Selected repo:")
        console.log(repo);

        const { onSetProgressMessage } = this.props;
        const {
            getAccessTokenSilently,
            user
        } = this.props.auth0;

        getAccessTokenSilently()
            .then(token => {
                const request = {
                    user_id: user.sub,
                    token: token,
                    repo_name: `${repo.owner}/${repo.name}`,
                    refresh_index: false // TEMP
                };
                this.websocket.send(JSON.stringify(request));

                onSetProgressMessage("Scraping repository");
            });
    }

    /* Renderers */

    renderSearchBar() {
        const { searchInput } = this.state;

        return (
            <div id="repositorySearch">
                <img id={searchInput == "" ? "passiveSearch" : "activeSearch"} src="./search_icon.png" />
                <input
                    id="inputFieldValue"
                    placeholder="Search..."
                    onChange={this.onChangeSearchInput}
                    value={searchInput}
                />
            </div>
        );
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { onSetProgressMessage, onSetCodebase } = this.props;

        this.fetchRepositoryOptions();

        // TODO: The websocket stuff in this component and GithubInput should be moved up a level

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://websocket-lb.useadrenaline.com/index_codebase_by_repo_name`);
        } else {
            this.websocket = new WebSocket(`wss://websocket-lb.useadrenaline.com/index_codebase_by_repo_name`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
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
                        primary: '#ffffff7a'
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
                        const { codebase_id, name, files, is_private } = metadata;
                        const repository = new Repository(codebase_id, name, files, is_private);
                        await onSetCodebase(repository, is_paywalled);
                    }
                } else {
                    onSetProgressMessage(message);
                }
            } else {
                // TODO: Render notification
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
        const {
            isGithubAuthenticated,
            searchInput,
            isLoading
        } = this.state;

        if (isLoading) {
            return (
                <div id="authenticatedGithubInput">
                    {this.renderSearchBar()}
                    <Spinner />
                </div>
            );
        }

        if (isGithubAuthenticated) {
            const groupedRepositories = this.groupRepositoriesByOwner();

            return (
                <div id="authenticatedGithubInput">
                    {this.renderSearchBar()}

                    <div id="repositoryList">
                        {Object.entries(groupedRepositories).map(([owner, repos], index) => {
                            const reposContainMatch = repos.some(repo => {
                                const { name } = repo;
                                return name.toLowerCase().startsWith(searchInput);
                            });

                            if (!reposContainMatch) {
                                return null;
                            }

                            return (
                                <>
                                    <div className="ownerSection">
                                        <div className="ownerHeader">{owner}</div>
                                        <div className="groupedRepos">
                                            {repos.map(repo => {
                                                const { name } = repo;

                                                if (!name.toLowerCase().startsWith(searchInput)) {
                                                    return null;
                                                }

                                                return (
                                                    <>
                                                        <div
                                                            className="repositoryItem"
                                                            onClick={() => this.onSelectRepository(repo)}
                                                        >
                                                            {name}
                                                        </div>
                                                        {
                                                            index < Object.keys(groupedRepositories).length - 1 ? (
                                                                <div className="divider" />
                                                            )
                                                                : null
                                                        }
                                                    </>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div id="authenticatedGithubInput">
                {this.renderSearchBar()}

                <div id="githubAuthPrompt">
                    <span>Authenticate with GitHub to add your repos</span>
                    <Button isPrimary onClick={this.onGithubAuthentication}>Connect with GitHub</Button>
                </div>
            </div>
        );
    }
}

export default withAuth0(AuthenticatedGithubInput);