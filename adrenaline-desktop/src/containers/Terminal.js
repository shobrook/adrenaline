import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

const PROMPT_SYMBOL = ">"

export default class Terminal extends Component {
	focus = () => this.input.focus();

	renderPrompt = () => (
		<span className="promptSymbol">
			{PROMPT_SYMBOL}
		</span>
	);

	renderHistory = history => (
		<div className="history">
			{history.map((priorCommand, index) => {
				const { command, stdout, stderr } = priorCommand;

				return (
					<div className="historyItem" key={index}>
						<div className="priorCommandContainer">
							{this.renderPrompt()}
							<span className="command">{command}</span>
						</div>
						<div className="outputContainer">
							<span className="stdout">{stdout}</span>
							<span className="stderr">{stderr}</span>
						</div>
					</div>
				);
			})}
		</div>
	);

	render() {
		const {
			filePath,
			stdout,
			stderr,
			onSubmit,
			onFixCode,
			isCodeBroken,
			history
		} = this.props;

    return (
      <div className="terminalContainer" onClick={this.focus}>
				<div className="header">
					<span className="terminalLabel">TERMINAL</span>
					{
						isCodeBroken ? (
							<div className="fixItButtonContainer">
								<Button
									className="fixItButton"
									isPrimary={true}
									onClick={onFixCode}
								>
									Fix It
								</Button>
							</div>
						) : null
					}
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
						{this.renderPrompt()}
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
