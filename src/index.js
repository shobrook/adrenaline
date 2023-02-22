import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HashRouter as Router, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

import './index.css';

import Landing from "./routes/Landing";
import App from "./routes/App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />
  },
  {
    path: "/playground",
    element: <App />
  }
]);

ReactDOM.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-0c5k2o4ad10lniwe.us.auth0.com"
      clientId="9JZ9notgpzW8BhCo5HMsv6h2HVUbdYhu"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "rubrick-api-production.up.railway.app"
      }}
    >
      <RouterProvider router={router} />
    </Auth0Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
