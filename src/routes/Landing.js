import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

import Popup from "../components/Popup";
import Button from "../components/Button";
import Header from "../containers/Header";

import { withRouter } from "../utilities";

import "./Landing.css";

class Landing extends Component {
	constructor(props) {
		super(props);

		this.onOpenPopup = this.onOpenPopup.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onClosePopup = this.onClosePopup.bind(this);
		this.onSetPopupRef = this.onSetPopupRef.bind(this);

		this.state = { askForLogIn: false };
	}

	onOpenPopup() {
		window.gtag("event", "click_login");

		this.setState({ askForLogIn: true });
	}

	onSubmit(email, password) {
		console.log("onSubmit test")
	    fetch('/login', {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ email: email, password: password })
	    })
	    .then(res => res.json())
	    .then(data => {
	        if (data.message === 'Login successful') {
	            // Handle successful login
	            // e.g. redirect to a new page, display a message, etc.
							console.log("onSubmit successful")
							return;
	        } else {
	            // Handle unsuccessful login
	            // e.g. display an error message, etc.
							console.log("onSubmit fail: ", data.message)
							return;
	        }
	    })
	    .catch(error => {
	        // Handle any errors that may occur during the login process
					console.log("testing onsubmit error")
	    });
	    this.setState({ askForLogIn: false });
	}

	onClosePopup(event) {
    if (this.popupRef && this.popupRef.contains(event.target)) {
      return;
    }

    this.setState({ askForLogIn: false });
  }

	onSetPopupRef(ref) { this.popupRef = ref; }

	render() {
		const { location } = this.props.router;
		const { askForLogIn } = this.state;

		window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
    });

    return (
			<Fragment>
				{askForLogIn ? (
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
	                <Button
										className="getStartedButton"
										isPrimary
										onClick={() => window.gtag("event", "click_get_started")}
									>
	                  Fix your code
	                </Button>
	              </Link>
	              <Button
									className="githubButton"
									isPrimary={false}
									onClick={() => window.gtag("event", "click_view_on_github")}
								>
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

export default withRouter(Landing);
