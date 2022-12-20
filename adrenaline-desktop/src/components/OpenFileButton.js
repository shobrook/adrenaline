import React, { Component } from "react";
import "./OpenFileButton.css";

export default class OpenFileButton extends Component {
	render() {
    const { onClick } = this.props;

		return (
      <div className="openFileButton" onClick={onClick}>
        Open File
      </div>
		);
	}
}
