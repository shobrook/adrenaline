import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Button from "../components/Button";
import Header from "../containers/Header";

import { withRouter } from "../library/utilities";
import Mixpanel from "../library/mixpanel";

import "../styles/Landing.css";

class Landing extends Component {
	constructor(props) {
		super(props);

		this.onGetStarted = this.onGetStarted.bind(this);
	}

	onGetStarted() {
		const { isAuthenticated } = this.props.auth0;
		const { navigate } = this.props.router;

		Mixpanel.track("click_get_started", { isAuthenticated });
		navigate("/app");
	}

	componentDidMount() {
		const { user, isAuthenticated } = this.props.auth0;

		if (isAuthenticated) {
			Mixpanel.identify(user.sub);
			Mixpanel.people.set({ email: user.email });
		}

		Mixpanel.track("load_landing_page");
	}

	render() {
		return (
			<div id="landing">
				<Header isTransparent />

				<div id="overTheFold">
					<div id="landingHeading">
						<span id="landingTitle">Understand your code <span>with AI</span></span>
						<p id="landingSubtitle">Stop using StackOverflow for help. Talk directly to your codebase like you would an expert.</p>
					</div>
					<Button
						id="getStartedButton"
						isPrimary
						onClick={this.onGetStarted}
					>
						Get started
					</Button>
				</div>
			</div>
		);
	}
}

export default withRouter(withAuth0(Landing));