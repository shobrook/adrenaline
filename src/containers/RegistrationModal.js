import { Component } from "react";

import Modal from "../components/Modal";
import Button from "../components/Button";

import "../styles/RegistrationModal.css";

export default class RegistrationModal extends Component {
    constructor(props) {
        super(props);

        this.onEmailChange = this.onEmailChange.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onReEnteredPasswordChange = this.onReEnteredPasswordChange.bind(this);
        this.onClickPrimary = this.onClickPrimary.bind(this);
        this.onClickSecondary = this.onClickSecondary.bind(this);

        this.state = { 
            isLoggingIn: true,
            email: "", 
            password: "", 
            reEnteredPassword: "",
            registrationError: ""
        };
    }

    onEmailChange(event) {
        this.setState({ email: event.target.value });
    }

    onPasswordChange(event) {
        this.setState({ password: event.target.value });
    }

    onReEnteredPasswordChange(event) {
        this.setState({ reEnteredPassword: event.target.value });
    }

    async onClickPrimary() {
        const { isLoggingIn, email, password, reEnteredPassword } = this.state;
        const { onLogIn, onSignUp } = this.props;

        let registrationError;
        if (isLoggingIn) {
            registrationError = await onLogIn(email, password);
        } else {
            registrationError = await onSignUp(email, password, reEnteredPassword);
        }

        this.setState({ registrationError });
    }

    onClickSecondary() {
        const { isLoggingIn } = this.state;

        this.setState({ 
            isLoggingIn: !isLoggingIn, 
            email: "", 
            password: "", 
            reEnteredPassword: "",
            registrationError: ""
        });
    }

    render() {
        const { isLoggingIn, email, password, reEnteredPassword, registrationError } = this.state;
        const { setModalRef, onCloseModal } = this.props;

        return (
            <Modal 
                setModalRef={setModalRef}
                onCloseModal={onCloseModal}
                header={isLoggingIn ? "Log in" : "Create an account"}
            >
                <div id="inputFields">
                    <textarea
                        id="emailField"
                        value={email}
                        onChange={this.onEmailChange}
                        placeholder="Email"
                        pattern="[^\n]*"
                    />
                    <input
                        className="passwordField"
                        value={password}
                        onInput={this.onPasswordChange}
                        placeholder="Password"
                        type="password"
                        pattern="[^\n]*"
                    />
                    {!isLoggingIn ? (
                        <input
                            className="passwordField"
                            value={reEnteredPassword}
                            onChange={this.onReEnteredPasswordChange}
                            placeholder="Re-enter password"
                            type="password"
                            pattern="[^\n]*"
                        />
                    ) : null}
                    <span id="registrationError">{registrationError}</span>
                    <Button className="loginButton" isPrimary onClick={this.onClickPrimary}>
                        {isLoggingIn ? "Log in" : "Create an account"}
                    </Button>
                    <Button className="loginButton" isPrimary={false} onClick={this.onClickSecondary}>
                        {isLoggingIn ? "Create an account" : "Log in"}
                    </Button>
                </div>
            </Modal>
        );
    }
}
