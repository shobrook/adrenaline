import React, { Component } from "react";

import "./Button.css";

export default class Button extends Component {
	render() {
		const { className, onClick, isPrimary, children } = this.props;

		return (
			<div
				className={`${className} ${isPrimary ? "primaryButton" : "secondaryButton"}`}
				onClick={onClick}
			>
				{children}
			</div>
		);
	}
}
