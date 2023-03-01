import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.css';

import Auth0ProviderWithHistory from "./auth/Auth0ProviderWithHistory";
import Landing from "./routes/Landing";
import App from "./routes/App";
import Subscription from './routes/Subscription';
import Referral from "./routes/Referral";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <Routes>
          <Route path="/" exact element={<Landing />} />
          <Route path="/playground" element={<App />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/referral" element={<Referral />} />
        </Routes>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);