import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

export default class Terminal extends Component {
	buildPromptSymbol = filePath => "~ >" // TEMP

	focus = () => this.input.focus();

	render() {
		const { filePath, onSubmit, onClickFixIt } = this.props;

    return (
      <div className="terminalContainer" onClick={this.focus}>
				<div className="header">
					<span className="terminalLabel">TERMINAL</span>
					<div className="fitItButtonContainer">
						<Button
							className="fixItButton"
							isPrimary={true}
							onClick={onClickFixIt}
						>
							Fix It
						</Button>
					</div>
				</div>
				<div className="body">
					<form
						className="terminalInputForm"
						onSubmit={e => {
							e.preventDefault();
							onSubmit(this.input.value);
						}}
					>
						<span className="promptSymbol">
							{this.buildPromptSymbol(filePath)}
						</span>
						<input
							className="terminalInput"
							ref={ref => this.input = ref}
						/>
					</form>
				</div>
			</div>
    )
	}
}
