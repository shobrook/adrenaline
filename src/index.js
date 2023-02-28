import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

import './index.css';

import Auth0ProviderWithHistory from "./auth/Auth0ProviderWithHistory";
import Landing from "./routes/Landing";
import App from "./routes/App";
import Subscription from './routes/Subscription';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/playground" element={<App />} />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);