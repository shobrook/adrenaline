import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { AiFillStar } from "react-icons/ai";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

export default function Header({ isTransparent, setShowSubscriptionModal, subscriptionPlan }) {
    const {
        isAuthenticated,
        loginWithRedirect,
        logout,
        user
    } = useAuth0();
    const [starsCount, setStarsCount] = useState(null);

    useEffect(() => {
        async function fetchStarsCount() {
            const res = await fetch(`https://api.github.com/repos/shobrook/adrenaline`);

            if (!res.ok) {
                // throw new Error("Failed to fetch stars count for adrenaline");
                return 1900;
            }

            const data = await res.json();
            return data.stargazers_count;
        }

        fetchStarsCount()
            .then(count => setStarsCount(count))
            .catch(error => console.error(error));
    }, [])

    const onLogout = () => {
        Mixpanel.track("click_logout");
        logout({ returnTo: window.location.origin });
    };

    const onLogIn = () => {
        Mixpanel.track("click_log_in");
        loginWithRedirect({
            appState: {
                returnTo: window.location.pathname
            }
        });
    };
    const onSignUp = () => {
        Mixpanel.track("click_sign_up");
        loginWithRedirect({
            authorizationParams: {
                screen_hint: "signup"
            },
            appState: {
                returnTo: window.location.pathname
            }
        });
    };

    return (
        <div className={isTransparent ? "header transparent" : "header"}>
            <div className="logo">
                <Link href="/">
                    <img src="./logo.png" alt={"our logo"} />
                </Link>
            </div>
            <div className="buttons">
                <div className="linkButtons">
                    <a className="discordIcon" href="https://discord.gg/NF5VxfVa2U" target="_blank">
                        Discord
                    </a>
                    <a className="githubIcon" href="https://github.com/shobrook/adrenaline/" target="_blank">
                        GitHub&nbsp;·&nbsp;<span className={"star-count"}>{starsCount}<AiFillStar /></span>
                    </a>
                </div>
                <div className="ctaButtons">
                    {isAuthenticated ? (
                        <UserNavDropdown
                            onLogout={onLogout}
                            setShowSubscriptionModal={setShowSubscriptionModal}
                            subscriptionPlan={subscriptionPlan}
                        />
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
                    <UserNavDropdown
                        onLogout={onLogout}
                        setShowSubscriptionModal={setShowSubscriptionModal}
                        subscriptionPlan={subscriptionPlan}
                    />
                ) : (
                    <>
                        <Button isPrimary={false} onClick={onLogIn}>Log in</Button>
                    </>
                )}
            </div>
        </div>
    );
}

const UserNavDropdown = ({ onLogout, setShowSubscriptionModal, subscriptionPlan }) => {
    const { getAccessTokenSilently, user } = useAuth0();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);
    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    const onClickManageAccount = () => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${process.env.NEXT_PUBLIC_API_URI}api/stripe/create_portal_session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: user.sub })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { portal_url } = data;

                        const win = window.open(portal_url, "_blank");
                        if (win != null) {
                            win.focus();
                        }
                    })
            })
    }
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownVisible(false);
            }
        }

        window.addEventListener("click", handleClickOutside);
        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    }, [dropdownRef]);

    let subscriptionTier;
    if (subscriptionPlan == undefined) {
        subscriptionTier = undefined;
    } else if (subscriptionPlan.startsWith("free")) {
        subscriptionTier = "Free trial";
    } else if (subscriptionPlan.startsWith("premium")) {
        subscriptionTier = "Premium plan";
    } else if (subscriptionPlan.startsWith("power")) {
        subscriptionTier = "Power plan";
    } else if (subscriptionPlan.startsWith("unlimited")) {
        subscriptionTier = "Unlimited plan";
    }

    return (
        <div className="user-nav-dropdown" ref={dropdownRef}>
            <div className={"dropdown-button"} onClick={toggleDropdown}>
                <img src={user?.picture} className="profile-picture" />
                <MdKeyboardArrowDown fill={"lightgrey"} size={24} />
            </div>
            {dropdownVisible && (
                <div className="dropdown-menu">
                    <div className="dropdown-item">
                        <a href="mailto: support@useadrenaline.com">Report a bug</a>
                    </div>
                    <div className={"dropdown-item"}>
                        <a onClick={onClickManageAccount}>Manage Subscription</a>
                    </div>
                    <div className={"dropdown-item"} onClick={onLogout}>
                        Logout
                    </div>
                    {subscriptionTier ? (
                        <div className="dropdown-item" id="subscriptionTier">
                            {subscriptionTier}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
