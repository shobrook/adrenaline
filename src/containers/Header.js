import { Link } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

import "../styles/Header.css";

function Header({ onClick, isTransparent }) {
	const {
		isAuthenticated,
		loginWithRedirect,
		logout,
	} = useAuth0();

	const onLogout = () => {
		Mixpanel.track("click_logout");
		logout({ returnTo: window.location.origin });
	};
	const onLogIn = () => {
		Mixpanel.track("click_log_in");
		loginWithRedirect({
			screen_hint: "signup",
			appState: {
				returnTo: window.location.pathname
			}
		});
	};
	const onSignUp = () => {
		Mixpanel.track("click_sign_up");
		loginWithRedirect({
			screen_hint: "signup",
			appState: {
				returnTo: window.location.pathname
			}
		});
	};

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
						<Button
							isPrimary
							onClick={onLogout}
						>
							Logout
						</Button>
					) : (
						<>
							<Button
								id="signUpButton"
								isPrimary
								onClick={onSignUp}
							>
								Sign up
							</Button>
							<Button
								isPrimary={false}
								onClick={onLogIn}
							>
								Log in
							</Button>
						</>
					)}
				</div>
			</div>
			<div className="compactButtons">
				{isAuthenticated ? (
					<Button isPrimary onClick={onLogout}>Logout</Button>
				) : (
					<>
						<Button isPrimary={false} onClick={onLogIn}>Log in</Button>
					</>
				)}
			</div>
		</div >

	);
}

export default Header;


