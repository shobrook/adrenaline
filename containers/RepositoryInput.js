import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import toast from "react-hot-toast";

import Button from "../components/Button";
import ExampleRepository from "../components/ExampleRepository";

import Mixpanel from "../library/mixpanel";

class RepositoryInput extends Component {
    constructor(props) {
        super(props);

        this.getRepoPathFromUrl = this.getRepoPathFromUrl.bind(this);
        this.renderExampleRepositories = this.renderExampleRepositories.bind(this);

        this.onSelectExampleRepository = this.onSelectExampleRepository.bind(this);
        this.onChangeUrl = this.onChangeUrl.bind(this);
        this.onSubmitUrl = this.onSubmitUrl.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { url: "" };
    }

    /* Utilities */

    getRepoPathFromUrl() {
        let { url } = this.state;
        url = url.trim();

        if (url.endsWith("/")) {
            url = url.slice(0, url.length - 1);
        }
        // handle both .com and .edu
        var components = url.split(".com/");
        if (url.includes(".edu")) {
            components = url.split(".edu/");
        }
        const repoPath = components[1];

        return repoPath;
    }

    renderExampleRepositories() {
        const { isGitLab } = this.props;

        if (isGitLab) {
            return (
                <>
                    <ExampleRepository
                        isGitLab
                        onClick={() => this.onSelectExampleRepository("graphviz/graphviz")}
                    >
                        graphviz/graphviz
                    </ExampleRepository>
                    <ExampleRepository
                        isGitLab
                        onClick={() => this.onSelectExampleRepository("baserow/baserow")}
                    >
                        baserow/baserow
                    </ExampleRepository>
                    <ExampleRepository
                        isGitLab
                        onClick={() => this.onSelectExampleRepository("ClearURLs/ClearUrls")}
                    >
                        ClearURLs/ClearUrls
                    </ExampleRepository>
                </>
            );
        }

        return (
            <>
                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("hwchase17/langchain")}
                >
                    hwchase17/langchain
                </ExampleRepository>
                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("psf/requests")}
                >
                    psf/requests
                </ExampleRepository>
                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("shobrook/adrenaline")}
                >
                    shobrook/adrenaline
                </ExampleRepository>
            </>
        );
    }

    /* Event Handlers */

    onSelectExampleRepository(codebaseId) {
        const { isGitLab } = this.props;
        this.setState(
            { url: `https://${isGitLab ? "gitlab" : "github"}.com/${codebaseId}` },
            this.onSubmitUrl
        );
    }

    onChangeUrl(event) {
        this.setState({ url: event.target.value });
    }

    onSubmitUrl() {
        const { onIndexRepository, isGitLab } = this.props;
        const { url } = this.state;
        const repoPath = this.getRepoPathFromUrl();

        if (url == "") {
            return;
        }

        if (repoPath == "" || repoPath == null) {
            toast.error("Invalid repository url");
            return;
        }

        onIndexRepository(repoPath, isGitLab);
        Mixpanel.track("Scrape public repository")
    }

    onKeyPress(event) {
        const code = event.keyCode || event.which;

        if (code === 13) {
            this.onSubmitUrl();
        }
    }

    /* Lifecycle Methods */

    render() {
        const { isGitLab } = this.props;
        const { url } = this.state;

        return (
            <>
                <div id="inputField" className="githubInput">
                    <div id="inputFieldArea">
                        <img id={url == "" ? "passiveLink" : "activeLink"} src="./link_icon.png" />
                        <input
                            id="inputFieldValue"
                            placeholder={`${isGitLab ? "GitLab" : "GitHub"} repository url`}
                            onChange={this.onChangeUrl}
                            value={url}
                            onKeyPress={this.onKeyPress}
                        />
                        <Button
                            id="sendInputButton"
                            isPrimary
                            onClick={this.onSubmitUrl}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                <span id="exampleRepositoriesTitle">Examples</span>
                {this.renderExampleRepositories()}
            </>
        );
    }
}

export default withAuth0(RepositoryInput);