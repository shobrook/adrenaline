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
			loginFailure: false,
			isWrongPassword: false,
			isInvalidAccount: false,
			doPasswordsMatch: true,
			signUpFailure: false,
			accountAlreadyExists: false,
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
			this.setState({ displayPopup: true, doPasswordsMatch: false});
			return;
		}

		fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
			const { success, accountAlreadyExists } = data;

      if (success) {
				window.gtag("event", "submit_signup_success");

				navigate("/playground");
				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				this.setState({ displayPopup: false, isLoggedIn: true });
      } else if (accountAlreadyExists) {
				window.gtag("event", "submit_signup_failure");
				//this.setState({ accountAlreadyExists: true });  //temp
      } else {
				window.gtag("event", "submit_signup_failure");
				//this.setState({ signUpFailure: true });  //temp
			}
    })
    .catch(error => {
			localStorage.setItem("isLoggedIn", JSON.stringify(true));  //temp
			window.gtag("event", "submit_signup_failure");
			this.setState({ displayPopup: false, isLoggedIn: true });
			//this.setState({ signUpFailure: true })  //temp
			navigate("/playground");
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
			const { success, isWrongPassword, isInvalidAccount } = data;

      if (success) {
				window.gtag("event", "submit_login_success");

				navigate("/playground");
				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				this.setState({ displayPopup: false, isLoggedIn: true });
      } else if (isWrongPassword) {
				window.gtag("event", "submit_login_failure");
				//this.setState({ displayPopup: true, isWrongPassword: true }); // temp
      } else if (isInvalidAccount) {
				window.gtag("event", "submit_login_failure");
				//this.setState({ displayPopup: true, isInvalidAccount: true }); //temp
			} else {
				window.gtag("event", "submit_login_failure");
				//this.setState({ displayPopup: true, loginFailure: true }); // temp
			}
    })
    .catch(error => {
			localStorage.setItem("isLoggedIn", JSON.stringify(true));
			this.setState({ displayPopup: false, isLoggedIn: true });
			window.gtag("event", "submit_login_failure");
			console.log(error);
			navigate("/playground");
			// this.setState({ loginFailure: true }); // temp
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
			loginFailure,
			signUpFailure,
			accountAlreadyExists,
			doPasswordsMatch,
			isWrongPassword,
			isInvalidAccount,
			isLoggedIn
		} = this.state;

		window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
    });
		//localStorage.setItem("isLoggedIn", JSON.stringify(true)); // temp
    return (
			<Fragment>
				{displayPopup && !isLoggedIn ? (
          <div className="popupLayer" onClick={this.onClosePopup}>
            <LoginForm
							onLogIn={this.onLogIn}
							onSignUp={this.onSignUp}
              setRef={this.onSetPopupRef}
							loginFailure={loginFailure}
							signUpFailure={signUpFailure}
							accountAlreadyExists={accountAlreadyExists}
							doPasswordsMatch={doPasswordsMatch}
							isInvalidAccount={isInvalidAccount}
							isWrongPassword={isWrongPassword}
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
