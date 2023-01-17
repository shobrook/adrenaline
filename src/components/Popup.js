import React, { Component } from 'react';

import Button from "./Button";

import "./Popup.css";

export default class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = { email: "", password: ""};
  }

  onChangeEmail = event => this.setState({ email: event.target.value });
  onChangePassword = event => this.setState({ password: event.target.value });

  render() {
    const { email, password } = this.state;
    const { onSubmit, setRef } = this.props;

    return (
      <div className="popup" ref={ref => setRef(ref)}>
        <div className="popupInner">
          <div className="popupHeader">
            <span className="popupHeading">Sign In to Adrenaline</span>
          </div>
          <div className="popupForm">
            <div className="inputField">
              <textarea
                className="inputText"
                ref={ref => this.input = ref}
                value={email}
                onChange={this.onChangeEmail}
                placeholder="Email"
              />
              <textarea
                className="inputText"
                ref={ref => this.input = ref}
                value={password}
                onChange={this.onChangePassword}
                placeholder="Password"
              />
              <Button className="popupSubmit" isPrimary onClick={() => {
                window.gtag("event", "submit_login");

                localStorage.setItem("email", email);
                localStorage.setItem("password", password);
                onSubmit(email, password);
              }}>
                Done
              </Button>
            </div>
            <div className="instructions">
              <span>1. Navigate to <a href="https://beta.openai.com/account/api-keys" target="_blank">https://beta.openai.com/account/api-keys</a></span>
              <span className="lastStep">2. Log in and click <b>+ Create a new secret key</b></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
