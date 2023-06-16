import { useEffect, useState, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import Button from "../components/Button";
import Header from "../containers/Header";

import Mixpanel from "../library/mixpanel";

import SubscriptionModal from "../containers/SubscriptionModal";
import { useRouter } from "next/router";

export default function LandingPage() {
    const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const [subscriptionStatus, setSubscriptionStatus] = useState({});
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const prevAuthState = useRef(isAuthenticated);

    function fetchUserMetadata() {
        if (!isAuthenticated) {
            return;
        }

        if (Object.keys(subscriptionStatus).length != 0) {
            return;
        }

        getAccessTokenSilently()
            .then(token => {
                fetch(`${process.env.NEXT_PUBLIC_API_URI}api/stripe/subscription_status`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const {
                            plan,
                            num_messages_sent,
                            num_repositories_indexed,
                            num_code_snippets_indexed
                        } = data;

                        setSubscriptionStatus({
                            plan,
                            numMessagesSent: num_messages_sent,
                            numRepositoriesIndexed: num_repositories_indexed,
                            numCodeSnippetsIndexed: num_code_snippets_indexed
                        });
                    });
            });
    }

    function onGetStarted() {
        Mixpanel.track("click_get_started", { isAuthenticated });
        router.push("/app");
    }

    useEffect(() => {
        if (isAuthenticated) {
            Mixpanel.identify(user.sub);
            Mixpanel.people.set({ email: user.email });
        }

        Mixpanel.track("load_landing_page");
    })

    useEffect(() => {
        if (prevAuthState.current !== isAuthenticated && isAuthenticated) {
            Mixpanel.identify(user.sub);
            Mixpanel.people.set({ email: user.email });

            fetchUserMetadata();
        }

        prevAuthState.current = isAuthenticated;
    }, [isAuthenticated])

    useEffect(() => {
        fetchUserMetadata();
    }, []);

    return (
        <div id="landing">
            <Header
                isTransparent
                setShowSubscriptionModal={setShowSubscriptionModal}
                subscriptionPlan={undefined}
            />

            <div id="overTheFold">
                <div id="landingHeading">
                    <span id="landingTitle">Understand any codebase <span>with AI</span></span>
                    <p id="landingSubtitle">Stop crawling through documentation. Talk directly to a package or project like you
                        would to an expert.</p>
                </div>
                <Button
                    id="getStartedButton"
                    isPrimary
                    onClick={onGetStarted}
                >
                    Get started
                </Button>
            </div>

            {showSubscriptionModal ?
                <div className={"grid p-2 justify-items-center"}>
                    <SubscriptionModal setShowSubscriptionModal={setShowSubscriptionModal} />
                </div>
                : null
            }
        </div>
    );
}
