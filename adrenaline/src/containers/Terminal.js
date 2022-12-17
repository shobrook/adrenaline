import React, { Component } from "react";
import "./Terminal.css";

export default class Terminal extends Component {
	buildPromptSymbol = filePath => "~ $ " // TEMP

	focus = () => this.input.focus();

	render() {
		const { filePath, onChange, onKeyDown, onSubmit } = this.props;

    return (
      <div className="terminal" onClick={this.focus}>
				<div className="terminalInputContainer">
					<form
						className="terminalInputForm"
						onKeyDown={onKeyDown}
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
							onChange={e => {
								e.persist();
								onChange(e);
							}}
							ref={ref => this.input = ref}
						/>
					</form>
				</div>
			</div>
    )
	}
}
