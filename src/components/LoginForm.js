import React, { Component } from 'react';
import { Link } from "react-router-dom";
import MailchimpSubscribe from "react-mailchimp-subscribe";

import Button from "./Button";

import "./LoginForm.css";

export default class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.state = { email: "" };
  }

  onChangeEmail = event => this.setState({ email: event.target.value });

  render() {
    const { email } = this.state;
    const {
      setRef,
      onSubmitEmail
    } = this.props;

    return (
      <div className="popup" ref={ref => setRef(ref)}>
        <div className="popupInner">
          <div className="popupHeader">
            <span className="popupHeading">We're adding features</span>
            <span className="popupSubheading">Please provide an email address so you can stay up-to-date.</span>
          </div>
          <form
            action="https://useadrenaline.us21.list-manage.com/subscribe/post?u=9f50237560a23d30081b5c718&amp;id=58de4ba216&amp;f_id=00e0d1e1f0"
            method="post"
            id="mc-embedded-subscribe-form"
            name="mc-embedded-subscribe-form"
            className="validate"
            target="_blank"
            noValidate=""
          >
            <div id="mc_embed_signup_scroll" style={{"display": "flex"}}>
              <div className="mc-field-group">
                <input
                  type="email"
                  defaultValue=""
                  name="EMAIL"
                  className="required email emailInputField"
                  id="mce-EMAIL"
                  required=""
                  placeholder="Email address"
                />
              </div>
              <div id="mce-responses" className="clear foot">
                <div
                  className="response"
                  id="mce-error-response"
                  style={{ display: "none" }}
                />
                <div
                  className="response"
                  id="mce-success-response"
                  style={{ display: "none" }}
                />
              </div>
              <div
                style={{ position: "absolute", left: "-5000px" }}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="b_9f50237560a23d30081b5c718_58de4ba216"
                  tabIndex={-1}
                  defaultValue=""
                />
              </div>
              <div className="optionalParent">
                <div className="clear foot" style={{
                  "display": "flex",
                  "align-items": "center",
                  "flex-direction": "row",
                  "justify-content": "center"
                }}>
                  <input
                    type="submit"
                    defaultValue="Subscribe"
                    name="subscribe"
                    id="mc-embedded-subscribe"
                    className="button"
                    style={{
                      "background-color": "#D93CFF"
                    }}
                    value="Submit"
                    onClick={event => {event.target.click(); onSubmitEmail(); }}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
