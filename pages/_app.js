import React from "react";
import "/styles/globals.css";
import {Toaster} from "react-hot-toast";
import Auth0ProviderWithHistory from "../components/Auth0ProviderWithHistory";
import {Head} from "next/document";

function MyApp({Component, pageProps}) {
    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
                />
                <title>Adrenaline</title>
            </Head>
            <Auth0ProviderWithHistory>
                <Toaster/>
                <Component {...pageProps} />
            </Auth0ProviderWithHistory>
        </>
    );
}

export default MyApp;
