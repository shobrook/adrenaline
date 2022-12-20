import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "./ErrorMessage.css";

export default class ErrorMessage extends Component {
	render() {
    const { errorMessage, onDebug } = this.props;

    return (
      <div className="errorMessage">
        <div className="errorMessageHeader">
          <span>Error Message</span>
          <Button onClick={onDebug} isPrimary>Debug</Button>
        </div>
      </div>
    );
	}
}
