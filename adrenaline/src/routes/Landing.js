import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import Header from "../containers/Header";

import "./Landing.css";

export default class Landing extends Component {
	render() {
    return (
      <div className="landing">
        <Header onClick={this.onOpenPopup} />
        <div className="landingBody">
          <div className="landingLHS">
            <div className="landingHeading">
              <span className="landingTitle">Fix your broken code in seconds</span>
              <p className="landingSubtitle">Adrenaline uses the OpenAI Codex to fix and explain your errors. Stop using StackOverflow to debug your code.</p>
            </div>
            <div className="ctaButtons">
              <Link to="/playground">
                <Button className="getStartedButton" isPrimary>
                  Get started
                </Button>
              </Link>
              <Button className="githubButton" isPrimary>
                View on Github
              </Button>
            </div>
          </div>
          <img />
        </div>
      </div>
    );
	}
}
