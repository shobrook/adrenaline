import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "../styles/ErrorMessage.css";

export default class ErrorMessage extends Component {
	constructor(props) {
		super(props);

		this.state = { value: "" };
	}

	onChange = event => this.setState({ value: event.target.value });

	render() {
		const { value } = this.state;
    const { onDebug, isLoading } = this.props;

    return (
      <div className="errorMessage">
        <div className="errorMessageHeader">
          <span>Error Message</span>
          <Button
						className="debugButton"
						onClick={() => onDebug(value)}
						isPrimary
						isLoading={isLoading}
					>
						Debug
					</Button>
        </div>
				<textarea
					className="errorMessageInput"
					ref={ref => this.input = ref}
					value={value}
					onChange={this.onChange}
					placeholder="Describe your error in simple terms. Or paste an error message / stack trace."
				/>
      </div>
    );
	}
}
