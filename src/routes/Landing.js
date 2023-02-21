import { Component } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import Header from "../containers/Header";

import { withRouter } from "../library/utilities";

import "../styles/Landing.css";

class Landing extends Component {
	render() {
		const { location } = this.props.router;

		window.gtag("event", "page_view", {
			page_path: location.pathname + location.search,
		});

		return (
			<>
				<div id="landing">
					<Header />

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
			</>
		);
	}
}

export default withRouter(Landing);