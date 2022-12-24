import React, { Component } from "react";
import { Controlled as CodeMirror } from 'react-codemirror2';

import Dropdown from "../components/Dropdown";

import "./CodeEditor.css";
import 'codemirror/lib/codemirror.css';
import "./theme.css"; // TODO: Move to CodeEditor.css

require('codemirror/mode/python/python');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/clike/clike');

export default class CodeEditor extends Component {
	constructor(props) {
		super(props);

		this.diffWidgets = {}
	}

	deleteDiffWidgets = diffIndex => {
		if (diffIndex in this.diffWidgets) {
			this.diffWidgets[diffIndex].oldCodeWidget.clear();
			this.diffWidgets[diffIndex].newCodeWidget.clear();

			delete this.diffWidgets[diffIndex];
		}
	}

	addDiffWidget = (insertLine, isFixedCode, onResolveDiff) => {
		let useMeHeader = document.createElement("div");
		let useMeButton = document.createElement("div");
		let useMeLabel = document.createElement("span");

		useMeHeader.className = isFixedCode ? "useMeHeader newCodeHeader" : "useMeHeader oldCodeHeader";
		useMeButton.className = isFixedCode ? "useMeButton newCodeButton" : "useMeButton oldCodeButton";
		useMeButton.innerHTML = "Use me";
		useMeButton.onclick = onResolveDiff;
		useMeLabel.className = "useMeLabel";
		useMeLabel.innerHTML = isFixedCode ? "fixed code" : "your code";

		useMeHeader.appendChild(useMeButton);
		useMeHeader.appendChild(useMeLabel);

		return this.codeMirrorRef.addLineWidget(insertLine, useMeHeader, { above: !isFixedCode });
	}

	addLineHighlights = diff => {
		const { oldLines, newLines, mergeLine } = diff;

		console.log(diff)

		oldLines.forEach((lineNum, index) => {
			let className = index === 0 ? "oldLine first" : "oldLine";
			this.codeMirrorRef.addLineClass(lineNum, "wrap", className);
		});
		newLines.forEach((lineNum, index) => {
			let className = index === newLines.length - 1 ? "newLine last" : "newLine";
			this.codeMirrorRef.addLineClass(lineNum, "wrap", className);
		});

		if (mergeLine !== -1) {
			this.codeMirrorRef.addLineClass(mergeLine, "wrap", "mergeLine");
		}
	}

	addDiffsToEditor = (diffs, onResolveDiff) => {
		diffs.forEach((diff, index) => {
			const { oldLines, newLines, mergeLine } = diff;

			let oldCodeWidget = this.addDiffWidget(oldLines.at(0), false, () => {
				let linesToDelete = newLines;
				linesToDelete.push(oldLines.at(0));

				onResolveDiff(linesToDelete, index, this.codeMirrorRef, diff);
				this.deleteDiffWidgets(index);
			});
			let newCodeWidget = this.addDiffWidget(newLines.at(-1), true, () => {
				let linesToDelete = oldLines;
				linesToDelete.push(newLines.at(-1));

				onResolveDiff(linesToDelete, index, this.codeMirrorRef, diff);
				this.deleteDiffWidgets(index);
			});

			this.diffWidgets[index] = {oldCodeWidget, newCodeWidget};
			this.addLineHighlights(diff);
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
						mode: language.toLowerCase(),
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
