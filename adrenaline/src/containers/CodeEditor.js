import React, { Component } from "react";
import { Controlled as CodeMirror } from 'react-codemirror2';

import Dropdown from "../components/Dropdown";

import "./CodeEditor.css";
import 'codemirror/lib/codemirror.css';
// import 'codemirror/theme/dracula.css';
import "./theme.css";

require('codemirror/mode/python/python');

export default class CodeEditor extends Component {
	constructor(props) {
		super(props);

		this.diffWidgets = {}
	}

	addDiffWidget = (insertLine, isFixedCode, onResolveDiff) => {
		let useMeHeader = document.createElement("div");
		let useMeButton = document.createElement("div");
		let useMeLabel = document.createElement("span");

		useMeHeader.className = "useMeHeader";
		useMeButton.className = "useMeButton";
		useMeButton.innerHTML = "Use me";
		useMeButton.onclick = onResolveDiff;
		useMeLabel.className = "useMeLabel";
		useMeLabel.innerHTML = isFixedCode ? "fixed code" : "your code";

		useMeHeader.appendChild(useMeButton);
		useMeHeader.appendChild(useMeLabel);

		return this.codeMirrorRef.addLineWidget(insertLine, useMeHeader, { above: !isFixedCode });
	}

	deleteDiffWidgets = codeChangeIndex => {
		if (codeChangeIndex in this.diffWidgets) {
			this.diffWidgets[codeChangeIndex].oldCodeWidget.clear();
			this.diffWidgets[codeChangeIndex].newCodeWidget.clear();

			delete this.diffWidgets[codeChangeIndex];
		}
	}

	addDiffsToEditor = (diffs, onResolveDiff) => {
		diffs.forEach((diff, index) => {
			const { oldLines, newLines, mergeLine } = diff;

			oldLines.forEach((lineNum, index) => {
				if (index === 0) {
						this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine first");
				} else {
					this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine");
				}
			});
			this.codeMirrorRef.addLineClass(mergeLine, "wrap", "mergeLine");
			newLines.forEach((lineNum, index) => {
				this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine");
			});
			this.codeMirrorRef.addLineClass(newLines.at(-1) + 1, "wrap", "newLine last"); // Because newLine is missing the last line

			let oldCodeWidget = this.addDiffWidget(oldLines.at(0), false, () => {
				this.deleteDiffWidgets(index);
				onResolveDiff(newLines, index, this.codeMirrorRef, diff);
			});
			let newCodeWidget = this.addDiffWidget(newLines.at(-1) + 1, true, () => {
				this.deleteDiffWidgets(index);
				onResolveDiff(oldLines, index, this.codeMirrorRef, diff);
			});

			this.diffWidgets[index] = {oldCodeWidget, newCodeWidget};
		});
	}

	componentDidUpdate() {
		const { diffs, onResolveDiff } = this.props;

		diffs.forEach((diff, index) => {
			const { oldLines, newLines, mergeLine } = diff;

			// Delete the diff decoration
	    oldLines.map((oldLine, index) => {
	      let className = "oldLine";
	      className += index === 0 ? " first" : "";
	      this.codeMirrorRef.removeLineClass(index, "wrap", className);
	    });
	    newLines.map((newLine, index) => {
	      let className = "newLine";
	      className += index === newLines.length - 1 ? " last" : "";
	      this.codeMirrorRef.removeLineClass(index, "wrap", className);
	    });
	    this.codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");

			this.deleteDiffWidgets(index);
		});

		this.addDiffsToEditor(diffs, onResolveDiff);
	}

	componentDidMount() {
		const { diffs, onResolveDiff } = this.props;
		this.addDiffsToEditor(diffs, onResolveDiff);
	}

	render() {
		const { language, code, onChange, onSelectLanguage } = this.props;

		return (
			<div className="codeEditorContainer">
				<Dropdown
					className="languageDropdown"
					value={language}
					onSelect={onSelectLanguage}
				/>
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
					editorDidMount={editor => this.codeMirrorRef = editor}
				/>
			</div>
	  );
	}
}
