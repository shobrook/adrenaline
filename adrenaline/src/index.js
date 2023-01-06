import React from 'react';
import ReactDOM from 'react-dom';
import { createHashRouter, RouterProvider } from "react-router-dom";

import './index.css';

import Landing from "./routes/Landing";
import App from "./routes/App";

const router = createHashRouter([
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
    <RouterProvider router={router} />
  </React.StrictMode>,
  document.getElementById("root")
);
