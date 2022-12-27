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

		this.createWidget = this.createWidget.bind(this);
		this.addDiffWidgets = this.addDiffWidgets.bind(this);
		this.deleteDiffWidgets = this.deleteDiffWidgets.bind(this);
		this.addLineHighlights = this.addLineHighlights.bind(this);
		this.deleteLineHighlights = this.deleteLineHighlights.bind(this);
		this.addDiffsToEditor = this.addDiffsToEditor.bind(this);
		this.deleteDiffsFromEditor = this.deleteDiffsFromEditor.bind(this);
	}

	/* Diff Utilities */

	createWidget(insertLineNum, isAboveLine, onClickUseMe) {
		let widget = document.createElement("div");
		widget.className = isAboveLine ? "useMeHeader oldCodeHeader" : "useMeHeader newCodeHeader";

		let useMeButton = document.createElement("div");
		useMeButton.className = isAboveLine ? "useMeButton oldCodeButton" : "useMeButton newCodeButton";
		useMeButton.innerHTML = "Use me";
		useMeButton.onclick = onClickUseMe;

		let label = document.createElement("span");
		label.className = "useMeLabel";
		label.innerHTML = isAboveLine ? "your code" : "fixed code";

		widget.appendChild(useMeButton);
		widget.appendChild(label);

		return this.codeMirrorRef.addLineWidget(insertLineNum, widget, { above: isAboveLine });
	}

	addDiffWidgets(diff, onResolveDiff) {
		const { oldLines, newLines, mergeLine } = diff;

		const oldCodeStart = oldLines.at(0);
		const newCodeEnd = newLines.at(-1);

		const onUseOldCode = () => {
			let linesToDelete = newLines;
			linesToDelete.push(mergeLine);

			onResolveDiff(diff, linesToDelete, oldCodeStart);
		};
		const onUseNewCode = () => {
			let linesToDelete = oldLines;
			linesToDelete.push(mergeLine);

			onResolveDiff(diff, linesToDelete, newCodeEnd);
		}

		const oldCodeWidgetInsertLine = oldLines.length === 0 ? mergeLine : oldCodeStart;
		const newCodeWidgetInsertLine = newLines.length === 0 ? mergeLine : newCodeEnd;

		diff.oldCodeWidget = this.createWidget(oldCodeWidgetInsertLine, true, onUseOldCode);
		diff.newCodeWidget = this.createWidget(newCodeWidgetInsertLine, false, onUseNewCode);
	}

	deleteDiffWidgets(diff) {
		diff.oldCodeWidget?.clear();
		diff.newCodeWidget?.clear();
	}

	addLineHighlights(diff) {
		const { oldLines, newLines, mergeLine } = diff;

		oldLines.forEach((lineNum, index) => {
			let className = index === 0 ? "oldLine first" : "oldLine";
			this.codeMirrorRef.addLineClass(lineNum, "wrap", className);
		});
		newLines.forEach((lineNum, index) => {
			let className = index === newLines.length - 1 ? "newLine last" : "newLine";
			this.codeMirrorRef.addLineClass(lineNum, "wrap", className);
		});

		if (mergeLine !== -1) { // QUESTION: Is this ever not hit?
			this.codeMirrorRef.addLineClass(mergeLine, "wrap", "mergeLine");
		}
	}

	deleteLineHighlights(diff) {
		const { oldLines, newLines, mergeLine } = diff;

		oldLines.forEach((oldLine, index) => {
			let className = "oldLine";
			className += index === 0 ? " first" : "";

			this.codeMirrorRef.removeLineClass(index, "wrap", className);
		});
		this.codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");
		newLines.forEach((newLine, index) => {
			let className = "newLine";
			className += index === newLines.length - 1 ? " last" : "";

			this.codeMirrorRef.removeLineClass(index, "wrap", className);
		});
	}

	addDiffsToEditor(diffs, onResolveDiff) {
		diffs.forEach((diff, index) => {
			this.addLineHighlights(diff);
			this.addDiffWidgets(diff, onResolveDiff);
		});
	}

	deleteDiffsFromEditor(diffs) {
		diffs.forEach((diff, index) => {
			this.deleteLineHighlights(diff);
			this.deleteDiffWidgets(diff);
		});
	}

	/* Lifecycle Methods */

	componentDidUpdate() {
		const { diffs, onResolveDiff } = this.props;

		this.deleteDiffsFromEditor(diffs);
		this.addDiffsToEditor(diffs, onResolveDiff);
	}

	componentDidMount() {
		const { diffs, onResolveDiff } = this.props;

		this.deleteDiffsFromEditor(diffs);
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
						mode: language,
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
