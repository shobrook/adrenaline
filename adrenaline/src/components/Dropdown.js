import React, { Component } from "react";

import "./Dropdown.css";

export default class Dropdown extends Component {
	render() {
		const { className, value, onSelect } = this.props;

		return (
			<div className={className}>
				<select className="dropdown" onChange={onSelect}>
	       <option value="Python">Python</option>
	       <option value="Javascript">Javascript</option>
	       <option value="Java">Java</option>
	     </select>
			</div>
		);
	}
}
