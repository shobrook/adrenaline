import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

// import Link from "../components/Link";
import Button from "../components/Button";

import "./Header.css";

export default class Header extends Component {
	render() {
		const { onClick } = this.props;

    return (
      <div className="header">
				<div className="logo">
					<Link to="/">
						<img src="./logo.svg" />
					</Link>
				</div>
				<div className="buttons">
					<Link to="/playground">Playground</Link>
					<a href="https://github.com/shobrook/adrenaline/" target="_blank">View on Github</a>
					<Button isPrimary onClick={onClick}>Set API key</Button>
				</div>
			</div>
    );
	}
}
