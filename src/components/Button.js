import { Component } from "react";

import "../styles/Button.css";

export default class Button extends Component {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	}

	onClick() {
		const { isLoading } = this.props;

		if (isLoading) {
			return null;
		}

		return this.props.onClick();
	}

	render() {
		const {
			id,
			className,
			isPrimary,
			children
		} = this.props;

		return (
			<div
				id={id}
				className={`${className} ${isPrimary ? "primaryButton" : "secondaryButton"}`}
				onClick={this.onClick}
			>
				{children}
			</div>
		);
	}
}
