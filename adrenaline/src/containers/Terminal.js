import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

const DEFAULT_STATE = {
	history: []
}

export default class Terminal extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

	buildPromptSymbol = filePath => ">" // TODO: Add current directory here

	focus = () => this.input.focus();

	render() {
		const { filePath, stdout, stderr, onSubmit, isCodeBroken } = this.props;
		const { history } = this.state;

    return (
      <div className="terminalContainer" onClick={this.focus}>
				<div className="header">
					<span className="terminalLabel">TERMINAL</span>
					<Button className="fixItButton">Fix It</Button>
				</div>
				<div className="body">
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
					<form
						className="terminalInputForm"
						onSubmit={e => {
							e.preventDefault();
							onSubmit(this.input.value);

							// Bring this up a level; store history in App
							this.setState(prevState => ({
								history: prevState.history.concat({
									command: this.input.value,
									output: stdout + '\n' + stderr
								})
							}));
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
