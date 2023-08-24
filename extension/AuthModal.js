import React, { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import Button from "../components/Button";
import Mixpanel from "./lib/mixpanel";

class AuthModal extends Component {
    constructor(props) {
        super(props);

        this.onSignUp = this.onSignUp.bind(this);
        this.onLogIn = this.onLogIn.bind(this);
    }

    /* Event Handlers */

    onSignUp() {
        const { loginWithRedirect } = this.props.auth0;

        Mixpanel.track("click_sign_up");
        loginWithRedirect({
            authorizationParams: {
                screen_hint: "signup"
            },
            appState: {
                returnTo: window.location.pathname // TODO: Use router instead?
            }
        });
    }

    onLogIn() {
        const { loginWithRedirect } = this.props.auth0;

        Mixpanel.track("click_log_in");
        loginWithRedirect({
            appState: {
                returnTo: window.location.pathname // TODO: Use router instead?
            }
        });
    }

    /* Lifecycle Methods */

    render() {
        const { repository } = this.props;

        return (
            <div className="authModal">
                <div className="authMessage">
                    <span className="authTitle">Get answers. Fast.</span>
                    <span className="authSubtitle">Sign up or log in to ask questions about <span>{repository.name}</span>.</span>
                </div>
                <div className="authOptions">
                    <Button className="ext-signUpButton" isPrimary onClick={this.onSignUp}>Sign up</Button>
                    <Button className="ext-loginButton" isPrimary={false} onClick={this.onLogIn}>Log in</Button>
                </div>
            </div>
        )
    }
}

export default withAuth0(AuthModal);