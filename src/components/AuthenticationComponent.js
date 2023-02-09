import { Component } from "react";

class AuthenticationComponent extends Component {
	constructor(props) {
		super(props);

		this.onSetRegistrationRef = this.onSetRegistrationRef.bind(this);
		this.onOpenRegistrationForm = this.onOpenRegistrationForm.bind(this);
		this.onCloseForm = this.onCloseForm.bind(this);
		this.onLogIn = this.onLogIn.bind(this);
		this.onLogOut = this.onLogOut.bind(this);
		this.onSignUp = this.onSignUp.bind(this);

		this.state = {
			isRegistering: false,
			isLoggedIn: false
		};

		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (isLoggedIn) {
			this.state.isLoggedIn = JSON.parse(isLoggedIn);
		}
	}

	onSetRegistrationRef(ref) {
		this.registrationRef = ref;
	}

	onOpenRegistrationForm() {
		this.setState({ isRegistering: true });
	}

	onCloseForm(event) {
		if (this.registrationRef && this.registrationRef.contains(event.target)) {
			return;
		}

		this.setState({ isRegistering: false });
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
			const { success } = data;

			if (success) {
				window.gtag("event", "submit_login_success");

				navigate("/playground");
				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				this.setState({ isRegistering: false, isLoggedIn: true });
			} else {
				window.gtag("event", "submit_login_failure");
				// TODO: Store failure status code in state, pass to RegistrationForm component
			}
		})
		.catch(error => {
			window.gtag("event", "submit_login_failure");
			console.log(error);

			// TODO: Store failure in state, pass to RegistrationForm component
		});
	}

	onLogOut() {
		localStorage.setItem("isLoggedIn", JSON.stringify(false));
		this.setState({ isLoggedIn: false });
	}

	onSignUp(email, password, reEnteredPassword) {
		const { navigate } = this.props.router;

		if (password !== reEnteredPassword) {
			// TODO: Return error
			return;
		}

		fetch("/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, password: password })
		})
		.then(res => res.json())
		.then(data => {
			const { success } = data;

			if (success) {
				window.gtag("event", "submit_signup_success");

				navigate("/playground");
				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				this.setState({ isRegistering: false, isLoggedIn: true });
			} else {
				window.gtag("event", "submit_signup_failure");
				// TODO: Store failure status code in state, pass to RegistrationForm component
			}
		})
		.catch(error => {
			window.gtag("event", "submit_signup_failure");
			console.log(error);

			// TODO: Store failure status code in state, pass to RegistrationForm component
		});
	}
}

export default AuthenticationComponent;
