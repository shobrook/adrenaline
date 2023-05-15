import { Component } from "react";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

export default class GitHubAuthenticationButton extends Component {
    constructor(props) {
        super(props);

        this.onGitHubAuthentication = this.onGitHubAuthentication.bind(this);
    }

    /* Event Handlers */

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

    /* Lifecycle Methods */

    render() {
        return (
            <Button
                isPrimary
                onClick={this.onGitHubAuthentication}
            >
                Authenticate with GitHub
            </Button>
        );
    }
}