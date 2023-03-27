import React from "react";
import ReactDOM from "react-dom";
import {BrowserRouter, Routes, Route} from "react-router-dom";

import "./styles/index.css";

import Auth0ProviderWithHistory from "./components/Auth0ProviderWithHistory";
import Landing from "./routes/Landing";
import App from "./routes/App";
import {Toaster} from "react-hot-toast";

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <Auth0ProviderWithHistory>
                <Routes>
                    <Route path="/" exact element={<Landing/>}/>
                    <Route path="/app" element={<App/>}/>
                </Routes>
                <Toaster/>
            </Auth0ProviderWithHistory>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
);