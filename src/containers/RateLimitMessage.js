import { Component } from "react";

import Button from "../components/Button";
import { withRouter } from "../library/utilities";

import "../styles/RateLimitMessage.css";

class RateLimitMessage extends Component {
    render() {
        const { className } = this.props;
        const { navigate } = this.props.router;

        return (
            <div className={`rateLimitMessage ${className ?? ""}`}>
                <span>Out of requests! <span>Get unlimited access for $5/month or by referring friends.</span></span>
                <Button
                    className="rateLimitButton"
                    isPrimary
                    onClick={() => { navigate("/subscription"); }}
                >
                    Upgrade
                </Button>
            </div>
        );
    }
}

export default withRouter(RateLimitMessage);