import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Button from "../components/Button";

class PaymentPlan extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.renderFeatures = this.renderFeatures.bind(this);
    }

    /* Event Handlers */

    onClick() {
        const { lookupKey } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;

        if (!isAuthenticated) {
            loginWithRedirect({
                appState: {
                    returnTo: window.location.pathname
                }
            });
            return;
        }

        getAccessTokenSilently()
            .then(token => {
                fetch(`${process.env.NEXT_PUBLIC_API_URI}api/stripe/create_checkout_session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        lookup_key: lookupKey
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { checkout_url } = data;

                        const win = window.open(checkout_url, "_blank");
                        if (win != null) {
                            win.focus();
                        }
                    });
            });
    }

    /* Helpers */

    renderFeatures() {
        const { features } = this.props;

        return features.map(feature => {
            return (
                <div className="planFeature">
                    <img src="./checkmark_secondary.png" alt={"checkmark"} />
                    <span>{feature}</span>
                </div>
            );
        });
    }

    /* Lifecycle Methods */

    render() {
        const {
            lookupKey,
            planName,
            price,
            isActive
        } = this.props;
        if (planName == "FREE") {
            return (
                <div key={lookupKey} className="paymentPlan">
                    <span className="planLabel">{planName} PLAN</span>
                    <span className="planPrice">{`$${price}/month`}</span>

                    <Button
                        className="selectPlan"
                        isPrimary={false}
                        isDisabled={true}
                    >
                        {"No Subscription Needed"}
                    </Button>
                    <div className="planFeatures">
                        {this.renderFeatures()} 
                    </div>
                </div>
            );}

        return (
            <div key={lookupKey} className="paymentPlan">
                <span className="planLabel">{planName} PLAN</span>
                <span className="planPrice">{`$${price}/month`}</span>

                <Button
                    className="selectPlan"
                    isPrimary
                    onClick={this.onClick}
                >
                    {isActive ? "Get started" : "Subscribe"}
                </Button>
                <div className="planFeatures">
                    {this.renderFeatures()}
                </div>
            </div>
        );
    }
}

export default withAuth0(PaymentPlan);