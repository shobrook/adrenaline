import { Component } from "react";

import Header from "../containers/Header";
import Button from "../components/Button";
import { withRouter } from "../library/utilities";

import "../styles/Referral.css";

class Referral extends Component {
    constructor(props) {
        super(props);

        this.onEmailChange = this.onEmailChange.bind(this);

        this.state = { email: "" };
    }

    onEmailChange(event) {
        this.setState({ email: event.target.value });
    }

    onSubmitEmail() {
        const { email } = this.state;

        // TODO: Make request to API
        // API will send an email to the user (either manually or with Auth0, i.e. spoofing a reset password page)
    }

    render() {
        const { email } = this.state;

        return (
            <>
                <div id="referral">
                    <Header isTransparent />

                    <div id="referralBody">
                        <div id="referralHeading">
                            <span id="referralParent">REFER A FRIEND</span>
                            <span id="referralTitle">Refer three friends for a lifetime of free and unlimited access</span>
                        </div>

                        <div id="referralForm">
                            <span>Submit three emails. Once all three of your friends sign up, you'll be granted unlimited access to Adrenaline.</span>
                            <div id="emailInput">
                                <textarea
                                    id="emailField"
                                    value={email}
                                    onChange={this.onEmailChange}
                                    placeholder="example@gmail.com"
                                    pattern="[^\n]*"
                                />
                                <Button isPrimary id="submitEmailButton" onClick={ }>Invite</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(Referral);