import React, { Component, Fragment } from "react";

import Link from "../components/Link";
import Button from "../components/Button";

import "./Header.css";

export default class Header extends Component {
	render() {
		const { onClick } = this.props;

    return (
      <div className="header">
				<div className="logo">
					<img src="./logo.svg" />
				</div>
				<div className="buttons">
					<Link>Playground</Link>
					<Link>View on Github</Link>
					<Button isPrimary onClick={onClick}>Set API key</Button>
				</div>
			</div>
    );
	}
}
