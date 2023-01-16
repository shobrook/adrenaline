import React, { Component } from "react";
import { Controlled as CodeMirror } from 'react-codemirror2';
import Select from 'react-select';

import Button from "../components/Button";

import "./CodeEditor.css";
import 'codemirror/lib/codemirror.css';
import "./theme.css"; // TODO: Move to CodeEditor.css

require('codemirror/mode/python/python');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/clike/clike');

const LANGUAGES = [
	{label: "Python", value: "python"},
	{label: "JavaScript", value: "javascript"},
	{label: "Java", value: "clike"},
	{label: "Ruby", value: "ruby"},
	{label: "PHP", value: "php"},
	{label: "C++", value: "clike"},
	{label: "C", value: "clike"},
	{label: "Shell", value: "shell"},
	{label: "C#", value: "clike"},
	{label: "Objective-C", value: "clike"},
	{label: "R", value: "r"},
	{label: "Go", value: "go"},
	{label: "Perl", value: "perl"},
	{label: "CoffeeScript", value: "coffeescript"},
	{label: "Scala", value: "clike"},
	{label: "Haskell", value: "haskell"},
	{label: "HTML", value: "htmlmixed"},
	{label: "CSS", value: "css"},
	{label: "Kotlin", value: "clike"},
	{label: "Rust", value: "rust"},
	{label: "SQL", value: "sql"},
	{label: "Swift", value: "swift"}
];

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

		if (mergeLine !== -1) {
			let className = "mergeLine";
			if (oldLines.length === 0 && newLines.length === 0) {
				className += " both";
			} else if (oldLines.length === 0) {
				className += " first";
			} else if (newLines.length === 0) {
				className += " last";
			}

			this.codeMirrorRef.addLineClass(mergeLine, "wrap", className);
		}
	}

	deleteLineHighlights(diff) {
		const { oldLines, newLines, mergeLine } = diff;

		oldLines.forEach((oldLine, index) => {
			let className = "oldLine";
			className += index === 0 ? " first" : "";

			this.codeMirrorRef.removeLineClass(index, "wrap", className);
		});
		newLines.forEach((newLine, index) => {
			let className = "newLine";
			className += index === newLines.length - 1 ? " last" : "";

			this.codeMirrorRef.removeLineClass(index, "wrap", className);
		});

		if (mergeLine !== -1) {
			let className = "mergeLine";
			if (oldLines.length === 0 && newLines.length === 0) {
				className += " both";
			} else if (oldLines.length === 0) {
				className += " first";
			} else if (newLines.length === 0) {
				className += " last";
			}

			this.codeMirrorRef.removeLineClass(mergeLine, "wrap", className);
		}
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

	componentDidUpdate(prevProps) {
		const { diffs: prevDiffs } = prevProps;
		const { diffs, onResolveDiff } = this.props;

		this.deleteDiffsFromEditor(prevDiffs);
		this.addDiffsToEditor(diffs, onResolveDiff);
	}

	componentDidMount() {
		const { diffs, onResolveDiff } = this.props;

		this.deleteDiffsFromEditor(diffs);
		this.addDiffsToEditor(diffs, onResolveDiff);
	}

	render() {
		const {
			language,
			code,
			onChange,
			onSelectLanguage,
			isLoading,
			onLint
		} = this.props;

		return (
			<div className="codeEditorContainer">
				<div className="codeEditorHeader">
					<Select
						classNamePrefix="languageDropdown"
						isClearable={false}
						options={LANGUAGES}
						onChange={onSelectLanguage}
						defaultValue={language}
						styles={{
							control: (provided, state) => ({
								...provided,
								boxShadow: "none",
								cursor: "pointer"
							}),
				      menu: (provided, state) => ({
				        ...provided,
				        backgroundColor: "#202030"
				      }),
							option: (provided, state) => ({
								...provided,
								fontFamily: "Arial",
								fontSize: "16px",
								fontWeight: "500",
								backgroundColor: state.isFocused ? "#279AF1" : "transparent",
								cursor: "pointer"
							})
				    }}
					/>
					<Button
						className="lintButton"
						onClick={onLint}
						isLoading={isLoading}
						isPrimary
					>
						Lint
					</Button>
				</div>
				<CodeMirror
					className="codeEditor"
				  value={code.join("\n")}
				  options={{
						mode: language.value,
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
