import { Component } from "react";

import Button from "../components/Button";
import Header from "../containers/Header";
import PaymentPlan from "../containers/PaymentPlan";

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

					<div id="overTheFold">
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

					<div id="underTheFold">
						<div id="featuresSection">
							<div id="debugFeature">
								<img src="./debug_demo.png" />
								<div className="featureOverview">
									<span>Fix your code with one click</span>
									<p>Input your code and describe the problem, and Adrenaline will propose a fix with just one click.</p>
								</div>
							</div>
							<div id="chatbotFeature">
								<div className="featureOverview">
									<span>Talk to AI about your code</span>
									<p>For more advanced errors, diagnose them by discussing your code with the Adrenaline chatbot.</p>
								</div>
								<img src="./chatbot_demo.png" />
							</div>
						</div>
						<div id="pricingSection">
							<div id="subscriptionHeading">
								<span id="subscriptionParent">PRICING</span>
								<span id="subscriptionTitle">Build more, debug less</span>
								<p id="subscriptionSubtitle">Cut StackOverflow out of the loop. Stop wasting time adding print statements to your code.</p>
							</div>
							<div id="pricingOptions">
								<PaymentPlan
									label="FREE"
									price={0}
									planKey="free_tier"
									features={["50 code fixes", "50 code scans", "50 chatbot messages"]}
								/>
								<PaymentPlan
									isSelected
									label="UNLIMITED"
									price={5}
									planKey="unlimited"
									features={["Unlimited code fixes", "Unlimited code fixes", "Unlimited chatbot messages"]}
									notActive
								/>
								<PaymentPlan
									label="POWER"
									price={15}
									planKey="power"
									features={["Unlimited everything", "Import from Github", "Run your code on-site"]}
								/>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}
}

export default withRouter(Landing);