import React, { Component } from "react";
import "./Terminal.css";

import Button from "../components/Button";

export default class Terminal extends Component {
	constructor(props) {
		super(props);

		this.state = {history: []};
	}

	buildPromptSymbol = filePath => "~ >" // TEMP

	focus = () => this.input.focus();

	render() {
		const { filePath, stdout, stderr, onSubmit, enableFixit } = this.props;

    return (
      <div className="terminalContainer" onClick={this.focus}>
				<div className="header">
					<span className="terminalLabel">TERMINAL</span>
					<Button className="fixItButton">Fix It</Button>
				</div>
				<div className="body">
					{ this.state.history.map((obj, index) => {
					  const { command, output } = obj;
					  return (
					    <div className="terminalHistory" key={index}>
					      <span>{command}</span>
					      <p>{output}</p>
					    </div>
					  )
					})}
					<form
						className="terminalInputForm"
						onSubmit={e => {
							e.preventDefault();
							onSubmit(this.input.value);

							console.log("command");
							console.log(this.input.value);
							console.log(stdout);
							console.log(stderr);
							console.log("");

							this.setState(prevState => ({
								history: prevState.history.concat({
									command: this.input.value,
									output: stdout + '\n' + stderr
								})
							}));
							// this.input.value = '';
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
