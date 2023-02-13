import { Component } from "react";

class AuthenticationComponent extends Component {
	constructor(props) {
		super(props);

		this.onSetModalRef = this.onSetModalRef.bind(this);
		this.onOpenRegistrationForm = this.onOpenRegistrationForm.bind(this);
		this.onCloseModal = this.onCloseModal.bind(this);
		this.onLogIn = this.onLogIn.bind(this);
		this.onLogOut = this.onLogOut.bind(this);
		this.onSignUp = this.onSignUp.bind(this);

		this.state = {
			isRegistering: false,
			isLoggedIn: false,
			isRateLimited: false,
			registrationError: ""
		};

		const isLoggedIn = localStorage.getItem("isLoggedIn");
		if (isLoggedIn) {
			this.state.isLoggedIn = JSON.parse(isLoggedIn);
		}
	}

	getEmailAddress() {
		let email = localStorage.getItem("email");
		return email ? JSON.parse(email) : "";
	}

	getLoginStatus() {
		let isLoggedIn = localStorage.getItem("isLoggedIn");
		return isLoggedIn ? JSON.parse(isLoggedIn) : false;
	}

	onSetModalRef(ref) {
		this.modalRef = ref;
	}

	onOpenRegistrationForm() {
		this.setState({ isRegistering: true });
	}

	onCloseModal(event) {
		if (this.modalRef && this.modalRef.contains(event.target)) {
			return;
		}

		this.setState({ isRegistering: false });
	}

	async onLogIn(email, password) {
		const { navigate } = this.props.router;

		return await fetch("https://rubrick-api-production.up.railway.app/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, password: password })
		})
		.then(res => res.json())
		.then(data => {
			const { success, message } = data;

			if (success) {
				window.gtag("event", "submit_login_success");

				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				localStorage.setItem("email", JSON.stringify(email));
				this.setState({ isRegistering: false, isLoggedIn: true });
				navigate("/playground");

				return "";
			} else {
				window.gtag("event", "submit_login_failure");
				return message;
			}
		})
		.catch(error => {
			window.gtag("event", "submit_login_failure");
			console.log(error);

			return "An unexpected error occurred";
		})
	}

	onLogOut() {
		localStorage.setItem("isLoggedIn", JSON.stringify(false));
		this.setState({ isLoggedIn: false });
	}

	async onSignUp(email, password, reEnteredPassword) {
		const { navigate } = this.props.router;

		if (password !== reEnteredPassword) {
			return "Passwords do not match";
		}

		await fetch("https://rubrick-api-production.up.railway.app/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, password: password })
		})
		.then(res => res.json())
		.then(data => {
			const { success, message } = data;

			if (success) {
				window.gtag("event", "submit_signup_success");

				localStorage.setItem("isLoggedIn", JSON.stringify(true));
				localStorage.setItem("email", JSON.stringify(email));
				this.setState({ isRegistering: false, isLoggedIn: true });
				navigate("/playground");

				return "";
			} else {
				window.gtag("event", "submit_signup_failure");
				return message;
			}
		})
		.catch(error => {
			window.gtag("event", "submit_signup_failure");
			console.log(error);

			return "An unexpected error occurred";
		});
	}
}

export default AuthenticationComponent;
