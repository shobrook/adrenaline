import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

import Popup from "../components/Popup";
import Button from "../components/Button";
import Header from "../containers/Header";

import "./Landing.css";

export default class Landing extends Component {
	constructor(props) {
		super(props);

		this.onOpenPopup = this.onOpenPopup.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onClosePopup = this.onClosePopup.bind(this);
		this.onSetPopupRef = this.onSetPopupRef.bind(this);

		this.state = { askForAPIKey: false };
	}

	onOpenPopup() { this.setState({ askForAPIKey: true }); }

	onSubmit() { this.setState({ askForAPIKey: false }); }

	onClosePopup(event) {
    if (this.popupRef && this.popupRef.contains(event.target)) {
      return;
    }

    this.setState({ askForAPIKey: false });
  }

	onSetPopupRef(ref) { this.popupRef = ref; }

	render() {
		const { askForAPIKey } = this.state;

    return (
			<Fragment>
				{askForAPIKey ? (
          <div className="popupLayer" onClick={this.onClosePopup}>
            <Popup
              onSubmit={this.onSubmit}
              setRef={this.onSetPopupRef}
            />
          </div>
        ) : null}
	      <div className="landing">
	        <Header onClick={this.onOpenPopup} isPlaygroundActive={false} />
	        <div className="landingBody">
	          <div className="landingLHS">
	            <div className="landingHeading">
	              <span className="landingTitle">Stop plugging your errors into StackOverflow</span>
	              <p className="landingSubtitle">Adrenaline is a debugging assistant powered by the OpenAI Codex. It can fix and explain your broken code in seconds.</p>
	            </div>
	            <div className="ctaButtons">
	              <Link to="/playground">
	                <Button className="getStartedButton" isPrimary>
	                  Launch
	                </Button>
	              </Link>
	              <Button className="githubButton" isPrimary={false}>
	                <a href="https://github.com/shobrook/adrenaline/" target="_blank">View on Github</a>
	              </Button>
	            </div>
	          </div>
	          <img className="demoImage" src="demo.png" />
	        </div>
	      </div>
			</Fragment>
    );
	}
}
