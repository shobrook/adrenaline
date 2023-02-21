import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";

import "../styles/Header.css";
import { useAuth0 } from '@auth0/auth0-react';

function Header({ onClick, isLoggedIn }) {


	const {
		isLoading,
		isAuthenticated,
		error,
		user,
		loginWithRedirect,
		logout,
	} = useAuth0();

	console.log({ error })

	return (
		<div className="header">
			<div className="logo">
				<Link to="/">
					<img src="./logo.png" />
				</Link>
			</div>
			<div>
				{user?.name}
			</div>
			<div className="buttons">
				<Button className="LogInButton" isPrimary onClick={isAuthenticated ? logout : loginWithRedirect}>{isAuthenticated ? "Log out" : "Log in"}</Button>
				<Button
					className="headerGithubButton"
					isPrimary={false}
					onClick={() => window.gtag("event", "click_view_on_github")}
				>
					<a href="https://github.com/shobrook/adrenaline/" target="_blank">View on GitHub</a>
				</Button>
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

export default Header;


