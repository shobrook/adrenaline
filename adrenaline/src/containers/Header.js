import React, { Component, Fragment } from "react";

import Link from "../components/Link";
import Button from "../components/Button";

import "./Header.css";

export default class Header extends Component {
	render() {
    return (
      <div className="header">
				<div className="logo">
					<img src="./logo.svg" />
				</div>
				<div className="buttons">
					<Link>About</Link>
					<Link>Contribute</Link>
					<Button isPrimary>Set API key</Button>
				</div>
			</div>
    );
	}
}
