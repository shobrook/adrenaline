import { Component } from "react";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

export default class GitLabAuthenticationButton extends Component {
    constructor(props) {
        super(props);

        this.onGitLabAuthentication = this.onGitLabAuthentication.bind(this);
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

    /* Lifecycle Methods */

    render() {
        return (
            <Button
                isPrimary
                onClick={this.onGitLabAuthentication}
            >
                Authenticate with GitLab
            </Button>
        );
    }
}