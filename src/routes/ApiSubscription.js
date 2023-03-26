import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Button from "../components/Button";
import { withRouter } from "../library/utilities";

import "../styles/ApiSubscription.css";
import "../styles/PaymentPlan.css";

class ApiSubscription extends Component {
    onSubscribe = () => {
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
                fetch("https://adrenaline-api-staging.up.railway.app/api/stripe/create_checkout_session", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        lookup_key: "api_access_bimonthly"
                    })
                })
                    .then(res => {
                        console.log(res)
                        return res.json()
                    })
                    .then(data => {
                        const { checkout_url } = data;

                        const win = window.open(checkout_url, "_blank");
                        if (win != null) {
                            win.focus();
                        }
                    })
            })
    }

    renderFeatures() {
        const isSelected = true;
        const features = [
            "Up to 500 requests to the debugging endpoint"
        ]

        return features.map(feature => {
            return (
                <div className="planFeature">
                    <img src={isSelected ? "./checkmark_primary.png" : "./checkmark_secondary.png"} alt={"checkmark"} />
                    <span>{feature}</span>
                </div>
            );
        });
    }

    render() {
        const isSelected = true;

        return (
            <div id="apiSubscription">
                <div className={`paymentPlan ${isSelected ? "isSelected" : ""}`}>
                    <span className={`planLabel ${isSelected ? "isSelected" : ""}`}>API Access</span>
                    <span className="planPrice">$50/month</span>
                    <Button
                        className={isSelected ? "selectPlanPrimary" : "selectPlan"}
                        isPrimary={isSelected}
                        onClick={this.onSubscribe}
                    >
                        Get started
                    </Button>
                    <div className={`planFeatures ${isSelected ? "isSelected" : ""}`}>
                        {this.renderFeatures()}
                    </div>
                </div>
            </div>
        );
    }
}

export default withAuth0(ApiSubscription);