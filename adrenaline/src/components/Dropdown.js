import React, { Component } from "react";

import "./Dropdown.css";

export default class Dropdown extends Component {
	render() {
		const { className, value } = this.props;

		return (
			<div className={className}>
        {value}
			</div>
		);
	}
}
