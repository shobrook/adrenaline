import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

export default class Terminal extends Component {
	buildPromptSymbol = filePath => ">" // TODO: Add current directory here

	focus = () => this.input.focus();

	renderHistory = history => (
		<div className="history">
			{history.map((priorCommand, index) => {
				const { command, output } = priorCommand;

				return (
					<div className="priorCommand" key={index}>
						<span>{command}</span>
						<p>{output}</p>
					</div>
				)
			})}
		</div>
	);

	render() {
		const { filePath, stdout, stderr, onSubmit, isCodeBroken, history } = this.props;

		console.log(history);

    return (
      <div className="terminalContainer" onClick={this.focus}>
				<div className="header">
					<span className="terminalLabel">TERMINAL</span>
					<Button className="fixItButton">Fix It</Button>
				</div>
				<div className="body">
					{this.renderHistory(history)}
					<form
						className="terminalInputForm"
						onSubmit={e => {
							e.preventDefault();
							onSubmit(this.input.value);
							this.input.value = '';
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
