import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

const PROMPT_SYMBOL = "$ >"

export default class Terminal extends Component {
	focus = () => this.input.focus();

	renderHistory = history => (
		<div className="history">
			{history.map((priorCommand, index) => {
				const { command, output } = priorCommand;

				return (
					<div className="priorCommand" key={index}>
						{PROMPT_SYMBOL} {command}<br />{output}
					</div>
				)
			})}
		</div>
	);

	render() {
		const { filePath, stdout, stderr, onSubmit, isCodeBroken, history } = this.props;

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
							{PROMPT_SYMBOL}
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
