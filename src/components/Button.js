import React, { Component } from "react";

import Spinner from "./Spinner";

import "../styles/Button.css";

export default class Button extends Component {
	constructor(props) {
		super(props);

		this.onClickButton = this.onClickButton.bind(this);
	}

	onClickButton() {
		const { isLoading, isDisabled, onClick } = this.props;

		if (isLoading || isDisabled) {
			return null;
		}

		return onClick();
	}

	render() {
		const { className, isPrimary, children, isLoading, isDisabled } = this.props;

		return (
			<div
				className={`${className} ${isPrimary ? "primaryButton" : "secondaryButton"} ${isDisabled ? "disabled": ""}`}
				onClick={this.onClickButton}
			>
				{isLoading ? (<Spinner />) : children}
			</div>
		);
	}
}
