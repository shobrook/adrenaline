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
        Mixpanel.track("click_sign_up");
        window.open(`${process.env.NEXT_PUBLIC_HOST_URI}?signup=true`)
    }

    onLogIn() {
        Mixpanel.track("click_log_in");
        window.open(`${process.env.NEXT_PUBLIC_HOST_URI}?login=true`)
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
                    <Button className="ext-loginButton" isPrimary={false} onClick={this.onLogIn} target="_blank" rel="noopener noreferrer">Log in</Button>
                </div>
            </div>
        )
    }
}

export default withAuth0(AuthModal);