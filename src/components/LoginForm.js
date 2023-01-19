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
      <div ref={ref => setRef(ref)}>
  {/* Begin Mailchimp Signup Form */}
  <link
    href="//cdn-images.mailchimp.com/embedcode/classic-071822.css"
    rel="stylesheet"
    type="text/css"
  />
  <style
    type="text/css"
    dangerouslySetInnerHTML={{
      __html:
        "\n\t#mc_embed_signup{background:#fff; clear:left; font:14px Helvetica,Arial,sans-serif;  width:600px;}\n\t/* Add your own Mailchimp form style overrides in your site stylesheet or in this style block.\n\t   We recommend moving this block and the preceding CSS link to the HEAD of your HTML file. */\n"
    }}
  />
  <div id="mc_embed_signup" style={{
    // "width": "50%",
    // "max-width": "600px",
    "height": "fit-content",
    "background-color": "#373751",
    "box-shadow": "0px 2px 8px 2px rgba(32, 32, 48, 0.5)",
    "border-radius": "10px",
    "color": "white",
    "display": "flex",
    "align-items": "center",
    "justify-content": "center",
    "z-index": "3",
  }}>
    <form
      action="https://useadrenaline.us21.list-manage.com/subscribe/post?u=9f50237560a23d30081b5c718&id=58de4ba216&f_id=00e0d1e1f0"
      method="post"
      id="mc-embedded-subscribe-form"
      name="mc-embedded-subscribe-form"
      className="validate"
      target="_blank"
      noValidate=""
      style={{
        "width": "75%",
        "align-items": "center",
        "justify-content": "center"
      }}
    >
      <div id="mc_embed_signup_scroll">
        <h2>Sign Up</h2>
        <div className="mc-field-group">
          <label htmlFor="mce-EMAIL">
            Email Address <span className="asterisk">*</span>
          </label>
          <input
            type="email"
            defaultValue=""
            name="EMAIL"
            className="required email"
            id="mce-EMAIL"
            required=""
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
        </div>{" "}
        {/* real people should not fill this in and expect good things - do not remove this or risk form bot signups*/}
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
            <div onClick={onSubmitEmail}>
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
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
  {/*End mc_embed_signup*/}
  </div>

    );
  }
}
