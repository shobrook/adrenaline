import { Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Auth0ProviderWithHistory = ({ children }) => {
    const router = useRouter()
    const [isClientLoaded, setIsClientLoaded] = useState(false);

    useEffect(() => {
        setIsClientLoaded(true);
    }, []);

    useEffect(() => {
        const { authSuccess } = router.query;
        if (authSuccess) {
            window.parent.postMessage(JSON.stringify({message: "successfulLogin"}), "*"); // TODO: Restrict origin
            window.close();
            return;
        }
    }, [router.query])

    const onRedirectCallback = (appState) => {
        router.push(appState?.returnTo || window.location.pathname);
    };

    // dont render component until client has loaded
    if (!isClientLoaded) {
        return null;
    }

    return (
        <Auth0Provider
            domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
            clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
            onRedirectCallback={onRedirectCallback}
            cacheLocation="localstorage"
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
            }}
        >
            {children}
        </Auth0Provider>
    );
};

export default Auth0ProviderWithHistory;