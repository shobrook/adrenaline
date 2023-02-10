import { Component } from "react";

import Button from "../components/Button";

import "../styles/RateLimitNotification.css";

export default class RateLimitNotification extends Component {
    render() {
        const { setRef, onCloseModal } = this.props;

        return (
            <div id="notificationBackground" onClick={onCloseModal}>
                <div id="notificationModal" ref={ref => setRef(ref)}>
                    <span id="modalHeading">You've hit your request limit</span>
                    <span id="modalSubHeading">We're working on a paid plan with extra features. Stay tuned.</span>
                </div>
            </div>
        );
    }
}
