import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

// import Link from "../components/Link";
import Button from "../components/Button";

import "./Header.css";

export default class Header extends Component {
	render() {
		const { isPlaygroundActive, onClick } = this.props;

    return (
      <div className="header">
				<div className="logo">
					<Link to="/">
						<img src="./logo.png" />
					</Link>
				</div>
				<div className="buttons">
					<Button className="headerGithubButton" isPrimary={false}>
						<a href="https://github.com/shobrook/adrenaline/" target="_blank">View on GitHub</a>
					</Button>
					<Button className="apiKeyButton" isPrimary onClick={onClick}>Set API key</Button>
				</div>
				<div className="compactButtons">
					<a className="githubIcon" href="https://github.com/shobrook/adrenaline/" target="_blank">
						<img src="./github.png" />
					</a>
					<img className="keyIcon" src="./key.png" onClick={onClick} />
				</div>
			</div>
    );
	}
}
