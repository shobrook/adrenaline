import React, { Component } from "react";

import "./Link.css";

export default class Link extends Component {
	render() {
		const { className, onClick, children } = this.props;

		return (
			<span
        className={className}
				onClick={onClick}
			>
				{children}
			</span>
		);
	}
}
