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
              <span className="landingTitle">Stop plugging your errors into StackOverflow</span>
              <p className="landingSubtitle">Adrenaline is a debugging assistant powered by the OpenAI Codex. It can fix and explain your broken code in seconds.</p>
            </div>
            <div className="ctaButtons">
              <Link to="/playground">
                <Button className="getStartedButton" isPrimary>
                  Get started
                </Button>
              </Link>
              <Button className="githubButton" isPrimary={false}>
                View on Github
              </Button>
            </div>
          </div>
          <img className="demoImage" src="demo.png" />
        </div>
      </div>
    );
	}
}
