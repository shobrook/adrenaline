import { Component } from "react";

import "../styles/AddCodeButton.css";

export default class AddCodeButton extends Component {
    render() {
        const { onClick, children } = this.props;

        return (
            <div
                className="addCodeButton"
                onClick={onClick}
            >
                <img className="addIcon" src="./add_icon.png" />
                <span className="addCodeLabel">{children}</span>
            </div>
        );
    }
}
