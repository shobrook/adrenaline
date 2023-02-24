import { Component } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import Header from "../containers/Header";

import { withRouter } from "../library/utilities";

import "../styles/Landing.css";

class Landing extends Component {
	constructor(props) {
		super(props);

		this.onGetStarted = this.onGetStarted.bind(this);
	}

	onGetStarted() {
		window.gtag("event", "click_get_started");

		const { navigate } = this.props.router;
		navigate("/playground");
	}

	render() {
		const { location } = this.props.router;

		window.gtag("event", "page_view", {
			page_path: location.pathname + location.search,
		});

		return (
			<>
				<div id="landing">
					<Header isTransparent />

					<div id="landingBody">
						<div id="landingHeading">
							<span id="landingTitle">Fix your broken code <span>in seconds</span></span>
							<p id="landingSubtitle">Stop pasting error messages into Google. Use AI to debug your code and teach you along the way.</p>
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
			</>
		);
	}
}

export default withRouter(Landing);