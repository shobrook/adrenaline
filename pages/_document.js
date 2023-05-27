import React from "react";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <script
                    dangerouslySetInnerHTML={
                        {
                            __html: `
                            (function(c,l,a,r,i,t,y){
                                c[a] = c[a] || function () { (c[a].q = c[a].q || 
                                []).push(arguments) };
                                t=l.createElement(r);
                                t.async=1;
                                t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];
                                y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "h3a3jo2ysj");`,
                        }}
                />
                <meta name="theme-color" content={"#fff"} />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
