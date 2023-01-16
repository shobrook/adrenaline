import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";

import LoginForm from "../components/LoginForm";
import KeyForm from "../components/KeyForm";
import Button from "../components/Button";
import Header from "../containers/Header";

import { withRouter } from "../utilities";

import "./Landing.css";

class Landing extends Component {
	constructor(props) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onOpenPopup = this.onOpenPopup.bind(this);
		this.onLogIn = this.onLogIn.bind(this);
		this.onSignUp = this.onSignUp.bind(this);
		this.onClosePopup = this.onClosePopup.bind(this);
		this.onSetPopupRef = this.onSetPopupRef.bind(this);

		this.state = {
			displayPopup: false,
			isInvalidLogin: false,
			isInvalidSignUp: false,
			isLoggedIn: false
		};

		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (isLoggedIn) {
			this.state.isLoggedIn = JSON.parse(isLoggedIn);
		}
	}

	onSubmit() { this.setState({ displayPopup: false }); }

	onOpenPopup() {
		window.gtag("event", "click_login");

		this.setState({ displayPopup: true });
	}

	onSignUp(email, password, reEnteredPassword) {
		const { navigate } = this.props.router;

		if (password !== reEnteredPassword) {
			this.setState({ displayPopup: true, isInvalidSignUp: true});
			return;
		}

		fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'Signup successful') {
				window.gtag("event", "submit_signup_success");

				navigate("/playground");
				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				this.setState({ displayPopup: false, isInvalidSignUp: false, isLoggedIn: true });
      } else {
				window.gtag("event", "submit_signup_failure");
				console.log("onSubmit fail: ", data.message)

				this.setState({ displayPopup: true, isInvalidSignUp: true });
      }
    })
    .catch(error => {
			window.gtag("event", "submit_signup_failure");

			console.log(error);

			// TEMP: Testing only
			localStorage.setItem("isLoggedIn", JSON.stringify(true));
			this.setState({ displayPopup: true, isInvalidSignUp: true });
    });
	}

	onLogIn(email, password) {
		const { navigate } = this.props.router;

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'Login successful') {
				window.gtag("event", "submit_login_success");

				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				navigate("/playground");
				this.setState({ displayPopup: false, isInvalidLogin: false, isLoggedIn: true });
      } else {
				window.gtag("event", "submit_login_failure");
				console.log("onSubmit fail: ", data.message)

				this.setState({ displayPopup: true, isInvalidLogin: true });
      }
    })
    .catch(error => {
			window.gtag("event", "submit_login_failure");

			console.log(error);
			// this.setState({ displayPopup: true, isInvalidLogin: true });

			// TEMP: Testing only
			localStorage.setItem("isLoggedIn", JSON.stringify(true));
			navigate("/playground");
			this.setState({ displayPopup: false, isInvalidLogin: false, isLoggedIn: true });
    });
	}

	onClosePopup(event) {
    if (this.popupRef && this.popupRef.contains(event.target)) {
      return;
    }

    this.setState({ displayPopup: false });
  }

	onSetPopupRef(ref) { this.popupRef = ref; }

	render() {
		const { location } = this.props.router;
		const {
			displayPopup,
			isInvalidLogin,
			isInvalidSignUp,
			isLoggedIn
		} = this.state;

		window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
    });

    return (
			<Fragment>
				{displayPopup && !isLoggedIn ? (
          <div className="popupLayer" onClick={this.onClosePopup}>
            <LoginForm
							onLogIn={this.onLogIn}
							onSignUp={this.onSignUp}
              setRef={this.onSetPopupRef}
							isInvalidLogin={isInvalidLogin}
							isInvalidSignUp={isInvalidSignUp}
            />
          </div>
        ) : null}
				{displayPopup && isLoggedIn ? (
          <div className="popupLayer" onClick={this.onClosePopup}>
            <KeyForm
							onSubmit={this.onSubmit}
							setRef={this.onSetPopupRef}
            />
          </div>
        ) : null}
	      <div className="landing">
	        <Header onClick={this.onOpenPopup} isPlaygroundActive={false} isLoggedIn={isLoggedIn} />
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
