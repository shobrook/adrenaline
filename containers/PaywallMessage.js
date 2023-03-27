import { Component } from "react";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

import "../styles/PaywallMessage.module.css";

class PaywallMessage extends Component {
    render() {
        const { className, onUpgradePlan } = this.props;

        return (
            <div className={`rateLimitMessage ${className ?? ""}`}>
                <span>Out of requests! <span>Upgrade your plan to get more.</span></span>
                <Button
                    className="rateLimitButton"
                    isPrimary
                    onClick={onUpgradePlan}
                >
                    Upgrade
                </Button>
            </div>
        );
    }
}

export default PaywallMessage;