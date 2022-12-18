import React, { Component } from "react";
import {Controlled as CodeMirror} from 'react-codemirror2';
import { aura } from "@uiw/codemirror-theme-aura";

import Button from "../components/Button";

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

import "./CodeEditor.css";

require('codemirror/mode/python/python');

export default class CodeEditor extends Component {
	constructor(props) {
		super(props);

		// this.state = {diffWidgets: {}}
		this.diffWidgets = {}
	}

	addDiffWidget = (insertLine, isFixedCode, onClickUseMe) => {
		let useMeHeader = document.createElement("div");
		let useMeButton = document.createElement("div");
		let useMeLabel = document.createElement("span");

		useMeHeader.className = "useMeHeader";
		useMeButton.className = "useMeButton";
		useMeButton.innerHTML = "Use me";
		useMeButton.onclick = onClickUseMe;
		useMeLabel.className = "useMeLabel";
		useMeLabel.innerHTML = isFixedCode ? "fixed code" : "your code";

		useMeHeader.appendChild(useMeButton);
		useMeHeader.appendChild(useMeLabel);

		return this.codeMirrorRef.addLineWidget(insertLine, useMeHeader, { above: isFixedCode });
	}

	deleteDiffWidgets = codeChangeIndex => {
		this.diffWidgets[codeChangeIndex].oldCodeWidget.clear();
		this.diffWidgets[codeChangeIndex].newCodeWidget.clear();
	}

	addCodeChangeDiffs = (codeChanges, onClickUseMe) => {
		codeChanges.forEach((codeChange, index) => {
			const { oldLines, newLines } = codeChange;

			oldLines.forEach((lineNum, index) => {
				if (index === oldLines.length - 1) {
						this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine last");
				} else {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine");
				}
			});
			newLines.forEach((lineNum, index) => {
				if (index === 0) {
						this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine first");
				} else {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine");
				}
			});

			let oldCodeWidget = this.addDiffWidget(oldLines.at(-1), false, () => {
				onClickUseMe(newLines, index, this.codeMirrorRef, codeChange);
				this.deleteDiffWidgets(index);
			});
			let newCodeWidget = this.addDiffWidget(newLines.at(0), true, () => {
				onClickUseMe(oldLines, index, this.codeMirrorRef, codeChange);
				this.deleteDiffWidgets(index);
			});

			this.diffWidgets[index] = {oldCodeWidget, newCodeWidget};
		});
	}

	render() {
		const { code, codeChanges, onChange, onClickUseMe } = this.props;

		console.log("Rendering")

		return (
			<CodeMirror
				className="codeEditor"
			  value={code.join("\n")}
			  options={{
					mode: "python",
					theme: "dracula",
			    lineNumbers: true
			  }}
			  onBeforeChange={onChange}
				onChange={onChange}
				editorDidMount={(editor) => {
					this.codeMirrorRef = editor;
					this.addCodeChangeDiffs(codeChanges, onClickUseMe);
				}}
			/>
	  );
	}
}
