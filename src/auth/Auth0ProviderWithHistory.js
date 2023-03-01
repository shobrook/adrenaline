import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

const Auth0ProviderWithHistory = ({ children }) => {
    // const domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const domain = "dev-0c5k2o4ad10lniwe.us.auth0.com";
    // const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
    const clientId = "9JZ9notgpzW8BhCo5HMsv6h2HVUbdYhu";
    const audience = "rubrick-api-production.up.railway.app";

    const navigate = useNavigate();

    const onRedirectCallback = (appState) => {
        navigate(appState?.returnTo || window.location.pathname);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            redirectUri={window.location.origin}
            onRedirectCallback={onRedirectCallback}
            audience={audience}
        >
            {children}
        </Auth0Provider>
    );
};

export default Auth0ProviderWithHistory;