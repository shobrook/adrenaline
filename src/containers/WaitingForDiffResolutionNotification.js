import { Component } from "react";

import Button from "../components/Button";

import "../styles/RateLimitNotification.css";

export default class WaitingForDiffResolutionNotification extends Component {
    render() {
        const { setRef, onCloseModal } = this.props;

        return (
            <div id="notificationBackground" onClick={onCloseModal}>
                <div id="notificationModal" ref={ref => setRef(ref)}>
                    <span id="modalHeading">You need to resolve your diffs!</span>
                    <span id="modalSubHeading">Select `USE ME` to use either your old code, or our new code. </span>
                </div>
            </div>
        );
    }
}
