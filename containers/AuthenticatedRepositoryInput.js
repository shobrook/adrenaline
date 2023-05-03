import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import toast from "react-hot-toast";

import Spinner from "../components/Spinner";
import Button from "../components/Button";
import { Repository } from "../library/data";
import Mixpanel from "../library/mixpanel";

class AuthenticatedRepositoryInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onSelectRepository = this.onSelectRepository.bind(this);
        this.onChangeSearchInput = this.onChangeSearchInput.bind(this);
        this.onGitHubAuthentication = this.onGitHubAuthentication.bind(this);
        this.onGitLabAuthentication = this.onGitLabAuthentication.bind(this);

        this.renderSearchBar = this.renderSearchBar.bind(this);

        this.fetchRepositoryOptions = this.fetchRepositoryOptions.bind(this);
        this.groupRepositoriesByOwner = this.groupRepositoriesByOwner.bind(this);

        this.state = {
            isAuthenticated: false,
            repositoryOptions: {},
            selectedRepository: "",
            searchInput: "",
            isLoading: false,
            secondaryIndexingProgressId: null
        };
    }

    /* Utilities */

    fetchRepositoryOptions() {
        const { isGitLab } = this.props;
        const { user, isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (!isAuthenticated) {
            return; // TODO: Prompt user to login? Or is this condition not possible
        }

        this.setState({ isLoading: true }, () => {
            getAccessTokenSilently()
                .then(token => {
                    fetch(`${process.env.NEXT_PUBLIC_API_URI}api/${isGitLab ? "gitlab" : "github"}_repositories`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ user_id: user.sub })
                    })
                        .then(res => res.json())
                        .then(data => {
                            const { is_authenticated, repos } = data;

                            console.log(data)

                            if (!is_authenticated) {
                                console.log(is_authenticated);
                                this.setState({
                                    isAuthenticated: false,
                                    isLoading: false
                                });
                                return;
                            }

                            console.log("gets here?")

                            const repositoryOptions = repos;
                            this.setState({
                                isAuthenticated: true,
                                isLoading: false,
                                repositoryOptions
                            });
                            console.log("STATE UPDATED")
                        })
                        .catch(error => console.log(error));
                });
        });
    }

    groupRepositoriesByOwner() {
        const { repositoryOptions } = this.state;

        const groupedRepositories = repositoryOptions.reduce((r, a) => {
            r[a.owner] = r[a.owner] || [];
            r[a.owner].push(a);

            return r;
        }, Object.create(null));

        console.log("this")
        console.log(groupedRepositories);

        return groupedRepositories;
    }

    /* Event Handlers */

    onGitLabAuthentication() {
        const scope = "read_user+read_repository+read_api";
        let authUrl = "https://gitlab.com/oauth/authorize?";
        authUrl += `client_id=${process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID}`;
        authUrl += `&redirect_uri=${process.env.NEXT_PUBLIC_GITLAB_REDIRECT_URI}`;
        authUrl += `&response_type=code`
        // authUrl += `&state=${process.env.NEXT_PUBLIC_GITLAB_STATE}`;
        authUrl += `&scope=${scope}`;

        const win = window.open(authUrl, "_blank");
        if (win != null) {
            win.focus();
        }

        Mixpanel.track("Connect to GitLab");
    }

    onGitHubAuthentication() {
        // const login = ""; // TODO: Populate this if user is already authenticated with Github
        const scope = "repo,read:org";

        let authUrl = "https://github.com/login/oauth/authorize?"
        authUrl += `client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`;
        authUrl += `&redirect_uri=${process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI}`;
        // authUrl += `&login=${login}`;
        authUrl += `&scope=${scope}`;

        const win = window.open(authUrl, "_blank");
        if (win != null) {
            win.focus();
        }

        Mixpanel.track("Connect to GitHub")
    }

    onChangeSearchInput(event) {
        this.setState({ searchInput: event.target.value });
    }

    onChangeRepository(event, newValue) {
        this.setState({ selectedRepository: newValue })
    }

    onSelectRepository(repo) {
        const { onSetProgressMessage, onSetCodebase, isGitLab } = this.props;
        const {
            getAccessTokenSilently,
            user
        } = this.props.auth0;

        getAccessTokenSilently()
            .then(token => {
                // TODO: The websocket stuff in this component and GithubInput should be moved up a level

                this.websocket = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}index_repository`);
                this.websocket.onopen = event => {
                    const request = {
                        user_id: user.sub,
                        token: token,
                        repo_name: `${repo.owner}/${repo.name}`,
                        is_gitlab: isGitLab,
                        refresh_index: false // TEMP
                    };
                    this.websocket.send(JSON.stringify(request));

                    onSetProgressMessage("Scraping repository");
                };
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
                                await onSetCodebase(repository, is_paywalled, message);
                            } else {
                                const { codebase_id, name, files, is_private } = metadata;
                                const repository = new Repository(codebase_id, name, files, repo.is_private, isGitLab);
                                await onSetCodebase(repository, is_paywalled);
                            }
                        } else {
                            onSetProgressMessage(message);
                        }
                    } else {
                        if (is_final) {
                            toast.dismiss(secondaryIndexingProgressId);
                            toast.success("Fine-tuning complete. Chatbot is fully optimized.", { id: secondaryIndexingProgressId });

                            this.websocket.close();
                        } else {
                            const toastId = toast.loading("Fine-tuning chatbot on your code. Output will continuously improve until complete.");
                            this.setState({ secondaryIndexingProgressId: toastId });
                        }
                    }
                }
                this.websocket.onerror = event => {
                    onSetProgressMessage("", true);
                    toast.error("We are experiencing unusually high load. Please try again at another time.", {
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
                };
                // this.websocket.onclose = event => {
                //     onSetProgressMessage("", true);
                //     toast.error("We are experiencing unusually high load. Please try again at another time.", {
                //         style: {
                //             borderRadius: "7px",
                //             background: "#FB4D3D",
                //             color: "#fff",
                //         },
                //         iconTheme: {
                //             primary: '#ffffff7a',
                //             secondary: '#fff',
                //         }
                //     });
                // };
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
        this.fetchRepositoryOptions();
    }

    componentDidUpdate(previousProps, previousState) {
        const { isAuthenticated: prevAuthStatus } = previousProps;
        const { isAuthenticated: currAuthStatus } = this.props;

        // User is authenticated
        if (!prevAuthStatus && currAuthStatus) {
            console.log("Updated due to authentication change")
            this.fetchRepositoryOptions();
        }
    }

    render() {
        const { isGitLab } = this.props;
        const {
            isAuthenticated,
            searchInput,
            isLoading
        } = this.state;

        console.log(this.state);

        if (isLoading) {
            return (
                <div id="authenticatedGithubInput">
                    {this.renderSearchBar()}
                    <Spinner />
                </div>
            );
        }

        if (isAuthenticated) {
            const groupedRepositories = this.groupRepositoriesByOwner();

            console.log("hits this")
            return (
                <div id="authenticatedGithubInput">
                    {this.renderSearchBar()}

                    <div id="repositoryList">
                        {Object.entries(groupedRepositories).map(([owner, repos]) => {
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
                                            {repos.map((repo, index) => {
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
                                                            index < repos.length - 1 ? (
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
                    <span>Authorize Adrenaline to access the list of your {isGitLab ? "GitLab" : "GitHub"} repositories</span>
                    <Button
                        isPrimary
                        onClick={() => isGitLab ? this.onGitLabAuthentication() : this.onGitHubAuthentication()}
                    >
                        Authenticate with {isGitLab ? "GitLab" : "GitHub"}
                    </Button>
                </div>
            </div>
        );
    }
}

export default withAuth0(AuthenticatedRepositoryInput);