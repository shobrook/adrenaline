import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";

import Spinner from "../components/Spinner";
import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";
import GitLabAuthenticationButton from "../components/GitLabAuthenticationButton";
import GitHubAuthenticationButton from "../components/GitHubAuthenticationButton";

class AuthenticatedRepositoryInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onSelectRepository = this.onSelectRepository.bind(this);
        this.onChangeSearchInput = this.onChangeSearchInput.bind(this);

        this.renderSearchBar = this.renderSearchBar.bind(this);

        this.fetchRepositoryOptions = this.fetchRepositoryOptions.bind(this);
        this.groupRepositoriesByOwner = this.groupRepositoriesByOwner.bind(this);

        this.state = {
            isAuthenticated: false,
            repositoryOptions: {},
            selectedRepository: "",
            searchInput: "",
            isLoading: false
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

                            if (!is_authenticated) {
                                console.log(is_authenticated);
                                this.setState({
                                    isAuthenticated: false,
                                    isLoading: false
                                });
                                return;
                            }

                            const repositoryOptions = repos;
                            this.setState({
                                isAuthenticated: true,
                                isLoading: false,
                                repositoryOptions
                            });
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

    onChangeSearchInput(event) {
        this.setState({ searchInput: event.target.value });
    }

    onChangeRepository(event, newValue) {
        this.setState({ selectedRepository: newValue })
    }

    onSelectRepository(repo) {
        const { onIndexRepository, isGitLab } = this.props;
        const repoPath = `${repo.owner}/${repo.name}`;

        onIndexRepository(repoPath, isGitLab);
        Mixpanel.track("Scrape public repository")
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
                    {isGitLab ? (<GitLabAuthenticationButton />) : (<GitHubAuthenticationButton />)}
                </div>
            </div>
        );
    }
}

export default withAuth0(AuthenticatedRepositoryInput);