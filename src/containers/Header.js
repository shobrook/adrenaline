import { Link } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';

import Button from "../components/Button";

import "../styles/Header.css";

function Header({ onClick, isTransparent }) {
	const {
		isAuthenticated,
		loginWithRedirect,
		logout,
	} = useAuth0();

	return (
		<div className={isTransparent ? "header transparent" : "header"}>
			<div className="logo">
				<Link to="/">
					<img src="./logo.png" />
				</Link>
			</div>
			<div className="buttons">
				<div className="linkButtons">
					<a className="discordIcon" href="https://discord.gg/jPaJY4Uffb" target="_blank">
						Discord
					</a>
					<a className="githubIcon" href="https://github.com/shobrook/adrenaline/" target="_blank">
						Github
					</a>
				</div>
				<div className="ctaButtons">
					{isAuthenticated ? (
						<Button isPrimary onClick={() => logout({ returnTo: window.location.origin })}>Logout</Button>
					) : (
						<>
							<Button
								id="signUpButton"
								isPrimary
								onClick={() => loginWithRedirect({
									screen_hint: "signup",
									appState: {
										returnTo: window.location.pathname
									}
								})}
							>
								Sign up
							</Button>
							<Button
								isPrimary={false}
								onClick={() => loginWithRedirect({
									screen_hint: "signup",
									appState: {
										returnTo: window.location.pathname
									}
								})}
							>
								Log in
							</Button>
						</>
					)}
				</div>
			</div>
			<div className="compactButtons">
				{isAuthenticated ? (
					<Button isPrimary onClick={logout}>Logout</Button>
				) : (
					<>
						<Button isPrimary={false} onClick={loginWithRedirect}>Log in</Button>
					</>
				)}
			</div>
		</div >

	);
}

export default Header;


