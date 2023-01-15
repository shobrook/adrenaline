import React, { Component } from 'react';

import Button from "./Button";

import "./Popup.css";

export default class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = { value: "" };

    const apiKey = localStorage.getItem("openAiApiKey");
    if (apiKey) {
      this.state.value = JSON.parse(apiKey);
    }
  }

  onChange = event => this.setState({ value: event.target.value });

  render() {
    const { value } = this.state;
    const { onSubmit, setRef } = this.props;

    return (
      <div className="popup" ref={ref => setRef(ref)}>
        <div className="popupInner">
          <div className="popupHeader">
            <span className="popupHeading">Adrenaline is powered by OpenAI</span>
            <span className="popupSubheading">Please provide an OpenAI API key. This key will only be stored locally in your browser cache.</span>
          </div>
          <div className="popupForm">
            <div className="inputField">
              <textarea
                className="inputText"
                ref={ref => this.input = ref}
                value={value}
                onChange={this.onChange}
                placeholder="Enter your OpenAI API key"
              />
              <Button className="popupSubmit" isPrimary onClick={() => {
                window.gtag("event", "submit_api_key");

                localStorage.setItem("openAiApiKey", JSON.stringify(value));
                onSubmit(value);
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
