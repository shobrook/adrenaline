import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "./ErrorMessage.css";

export default class ErrorMessage extends Component {
	constructor(props) {
		super(props);

		this.state = { value: "" };
	}

	onChange = event => this.setState({ value: event.target.value });

	render() {
		const { value } = this.state;
    const { onDebug } = this.props;

    return (
      <div className="errorMessage">
        <div className="errorMessageHeader">
          <span>Error Message</span>
          <Button
						className="debugButton"
						onClick={() => onDebug(value)}
						isPrimary
					>
						Fix it
					</Button>
        </div>
				<textarea
					className="errorMessageInput"
					ref={ref => this.input = ref}
					value={value}
					onChange={this.onChange}
					placeholder="Paste your error message here"
				/>
      </div>
    );
	}
}
