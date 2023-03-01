import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';

import './index.css';

import Auth0ProviderWithHistory from "./auth/Auth0ProviderWithHistory";
import Landing from "./routes/Landing";
import App from "./routes/App";
import Subscription from './routes/Subscription';

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Auth0ProviderWithHistory>
        <Routes>
          <Route path="/" exact element={<Landing />} />
          <Route path="/playground" element={<App />} />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </Auth0ProviderWithHistory>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById("root")
);