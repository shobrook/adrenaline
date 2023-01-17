import React, { Component } from 'react';
import { Link } from "react-router-dom";

import Button from "./Button";

import "./LoginForm.css";

export default class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.state = { email: "", password: "", reEnteredPassword: "", isSignUp: false };
  }

  onChangeEmail = event => this.setState({ email: event.target.value });
  onChangePassword = event => this.setState({ password: event.target.value });
  onChangeReEnteredPassword = event => this.setState({ reEnteredPassword: event.target.value });
  onClickSignUp = () => this.setState({ isSignUp: true, email: "", password: "", reEnteredPassword: "" });
  onClickLogin = () => this.setState({ isSignUp: false, email: "", password: "", reEnteredPassword: "" });

  render() {
    const { email, password, reEnteredPassword, isSignUp } = this.state;
    const {
      onLogIn,
      onSignUp,
      loginFailure,
      signUpFailure,
      accountAlreadyExists,
      doPasswordsMatch,
      isWrongPassword,
      isInvalidAccount,
      setRef
    } = this.props;

    return (
      <div id="loginFormContainer" ref={ref => setRef(ref)}>
        <div id="loginForm">
          <div id="heading">
            <span id="title">{isSignUp ? "Create an account" : "Log in"}</span>
          </div>
          <div id="loginInputFields">
            <textarea
              className="inputText"
              value={email}
              onChange={this.onChangeEmail}
              placeholder="Email"
              pattern="[^\n]*"
            />
            <input
              className="inputText password"
              defaultValue={password}
              onInput={event => this.setState({password: event.target.value})}
              placeholder="Password"
              type="password"
              pattern="[^\n]*"
            />
            {isSignUp ? (
              <input
                className="inputText password"
                value={reEnteredPassword}
                onChange={this.onChangeReEnteredPassword}
                placeholder="Re-enter password"
                type="password"
                pattern="[^\n]*"
              />
            ) : null}
            {isSignUp && signUpFailure ? (<span className="failure">Failed to create account</span>) : null}
            {isSignUp && accountAlreadyExists ? (<span className="failure">Account already exists</span>) : null}
            {isSignUp && !doPasswordsMatch ? (<span className="failure">Passwords don't match</span>) : null}
            {!isSignUp && loginFailure ? (<span className="failure">Failed to login</span>) : null}
            {!isSignUp && isWrongPassword ? (<span className="failure">Incorrect password</span>) : null}
            {!isSignUp && isInvalidAccount ? (<span className="failure">Account doesn't exist</span>) : null}
            <Button className="loginButton" isPrimary onClick={() => {
              if (isSignUp) {
                onSignUp(email, password, reEnteredPassword);
              } else {
                onLogIn(email, password);
              }
            }}>
              {isSignUp ? "Create an account" : "Log in"}
            </Button>
            <Button className="loginButton" isPrimary={false} onClick={() => {
              if (isSignUp) {
                this.onClickLogin();
              } else {
                this.onClickSignUp();
              }
            }}>
              {isSignUp ? "Log in" : "Create an account"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
