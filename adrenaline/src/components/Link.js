import React, { Component } from "react";

import "./Link.css";

export default class Link extends Component {
	render() {
		const { className, onClick, children } = this.props;

		return (
			<a
        className={`link ${className}`}
				onClick={onClick}
			>
				{children}
			</a>
		);
	}
}
