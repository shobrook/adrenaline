import React, { Component } from "react";

import Spinner from "./Spinner";

import "./Button.css";

export default class Button extends Component {
	render() {
		const { className, onClick, isPrimary, children, isLoading } = this.props;

		return (
			<div
				className={`${className} ${isPrimary ? "primaryButton" : "secondaryButton"}`}
				onClick={onClick}
			>
				{isLoading ? (<Spinner />) : children}
			</div>
		);
	}
}
