import { Component } from "react";

import Mixpanel from "../library/mixpanel";
import GitLabAuthenticationButton from "../components/GitLabAuthenticationButton";
import GitHubAuthenticationButton from "../components/GitHubAuthenticationButton";

export default class AuthenticationWall extends Component {
    render() {
        const { isGitLab } = this.props;

        return (
            <div className="rateLimitMessage codeExplorerPaywall">
                <span>Authorize Adrenaline to view this repository</span>
                { isGitLab ? (<GitLabAuthenticationButton />) : (<GitHubAuthenticationButton />)}
            </div>
        );
    }
}