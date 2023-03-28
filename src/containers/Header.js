import {Link} from "react-router-dom";
import {useAuth0} from '@auth0/auth0-react';

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

import "../styles/Header.css";
import {useState} from "react";

export default function Header({isTransparent, setShowSubscriptionModal}) {
    const {
        isAuthenticated,
        loginWithRedirect,
        logout,
        user
    } = useAuth0();

    const onLogout = () => {
        Mixpanel.track("click_logout");
        logout({returnTo: window.location.origin});
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
                    <img src="./logo.png" alt={"our logo"}/>
                </Link>
            </div>
            <div className="buttons">
                <div className="linkButtons">
                    <a className="discordIcon" href="https://discord.gg/NF5VxfVa2U" target="_blank">
                        Discord
                    </a>
                    <a className="githubIcon" href="https://github.com/shobrook/adrenaline/" target="_blank">
                        Github
                    </a>
                </div>
                <div className="ctaButtons">
                    {isAuthenticated ? (
                        <UserNavDropdown user={user} onLogout={onLogout}
                                         setShowSubscriptionModal={setShowSubscriptionModal}/>
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
                    <UserNavDropdown user={user} onLogout={onLogout}
                                     setShowSubscriptionModal={setShowSubscriptionModal}/>
                ) : (
                    <>
                        <Button isPrimary={false} onClick={onLogIn}>Log in</Button>
                    </>
                )}
            </div>
        </div>
    );
}

const UserNavDropdown = ({user, onLogout, setShowSubscriptionModal}) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <div className="user-nav-dropdown">
            <img
                src={user?.picture}
                alt="User profile"
                className="profile-picture"
                onClick={toggleDropdown}
            />
            {dropdownVisible && (
                <div className="dropdown-menu">
                    <div className={"dropdown-item"}>
                        <a href={"#pricingSection"}>Manage Account</a>
                    </div>
                    <div className={"dropdown-item"} onClick={onLogout}>
                        Logout
                    </div>
                    <div className={"dropdown-item"}>
                        <Button
                            isPrimary
                            onClick={() => {
                                setShowSubscriptionModal(true)
                            }}
                        >
                            Upgrade Account
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};