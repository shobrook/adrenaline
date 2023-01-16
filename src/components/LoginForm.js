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
  onClickSignUp = () => this.setState({ isSignUp: true });
  onClickLogin = () => this.setState({ isSignUp: false });

  render() {
    const { email, password, reEnteredPassword, isSignUp } = this.state;
    const {
      onLogIn,
      onSignUp,
      isInvalidLogin,
      isInvalidSignUp,
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
            />
            <textarea
              className="inputText"
              value={password}
              onChange={this.onChangePassword}
              placeholder="Password"
            />
            {isSignUp ? (
              <textarea
                className="inputText"
                value={reEnteredPassword}
                onChange={this.onChangeReEnteredPassword}
                placeholder="Re-enter password"
              />
            ) : null}
            {isInvalidLogin && !isSignUp ? (<span>Invalid login</span>) : null}
            {isInvalidSignUp && isSignUp ? (<span>Invalid signup</span>) : null}
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
