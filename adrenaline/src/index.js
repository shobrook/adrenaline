import React from 'react';
import ReactDOM from 'react-dom';
import { createHashRouter, RouterProvider } from "react-router-dom";
import { HashRouter as Router, Route } from 'react-router-dom';

import './index.css';

import Landing from "./routes/Landing";
import App from "./routes/App";

// const router = createHashRouter([
//   {
//     path: "/",
//     element: <Landing />
//   },
//   {
//     path: "/playground",
//     element: <App />
//   }
// ]);
//
// ReactDOM.render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>,
//   document.getElementById("root")
// );

ReactDOM.render(
  <React.StrictMode>
  <Router basename="https://shobrook.github.io/adrenaline">
    <Route exact path="/" component={Landing} />
    <Route path="/playground" component={App} />
  </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
