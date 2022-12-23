import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "./ErrorMessage.css";

export default class ErrorMessage extends Component {
	render() {
    const { onDebug } = this.props;

    return (
      <div className="errorMessage">
        <div className="errorMessageHeader">
          <span>Error Message</span>
          <Button
						className="debugButton"
						onClick={() => onDebug(this.input.value)}
						isPrimary
					>
						Fix it
					</Button>
        </div>
				<textarea
					className="errorMessageInput"
					ref={ref => this.input = ref}
				/>
      </div>
    );
	}
}
