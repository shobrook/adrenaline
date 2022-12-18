import React, { Component } from "react";
import "./Button.css";

export default class Button extends Component {
	render() {
		const { className, onClick, isPrimary, children } = this.props;

		return (
			<div
				className={isPrimary ? `${className} primaryButton` : `${className} secondaryButton`}
				onClick={onClick}
			>
				{children}
			</div>
		);
	}
}
