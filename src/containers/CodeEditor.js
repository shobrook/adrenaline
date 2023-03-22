import React, { Component } from "react";
import { Controlled as CodeMirror } from 'react-codemirror2';
import Select from 'react-select';

import Button from "../components/Button";
import RateLimitMessage from "./RateLimitMessage";
import Alert from "../components/Alert";
import InputField from "../containers/InputField";

import "../styles/CodeEditor.css";
import 'codemirror/lib/codemirror.css';

require('codemirror/mode/python/python');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/clike/clike');

const LANGUAGES = [
	{ label: "Python", value: "python", compilerId: 116, codeExample: [["# Paste your code here"]] },
	{ label: "JavaScript", value: "javascript", compilerId: 112, codeExample: ["// Paste your code here"] },
	{ label: "Node.js", value: "javascript", compilerId: 56, codeExample: ["// Paste your code here"] },
	{ label: "Java", value: "clike", compilerId: 10, codeExample: ["// Paste your code here"] },
	{ label: "Ruby", value: "ruby", compilerId: 17, codeExample: ["# Paste your code here"] },
	{ label: "PHP", value: "php", compilerId: 29, codeExample: ["// Paste your code here"] },
	{ label: "C++", value: "clike", compilerId: 1, codeExample: ["// Paste your code here"] },
	{ label: "C", value: "clike", compilerId: 11, codeExample: ["// Paste your code here"] },
	{ label: "R", value: "r", compilerId: 117, codeExample: ["# Paste your code here"] },
	{ label: "Bash", value: "shell", compilerId: 28, codeExample: ["# Paste your code here"] },
	{ label: "C#", value: "clike", compilerId: 86, codeExample: ["// Paste your code here"] },
	{ label: "Objective-C", value: "clike", compilerId: 43, codeExample: ["// Paste your code here"] },
	{ label: "Go", value: "go", compilerId: 114, codeExample: ["// Paste your code here"] },
	{ label: "Perl", value: "perl", compilerId: 54, codeExample: ["# Paste your code here"] },
	{ label: "Scala", value: "clike", compilerId: 39, codeExample: ["// Paste your code here"] },
	{ label: "Haskell", value: "haskell", compilerId: 21, codeExample: ["-- Paste your code here"] },
	{ label: "Kotlin", value: "clike", compilerId: 47, codeExample: ["// Paste your code here"] },
	{ label: "Rust", value: "rust", compilerId: 93, codeExample: ["// Paste your code here"] },
	{ label: "SQL", value: "sql", compilerId: 52, codeExample: ["-- Paste your code here"] },
	{ label: "Swift", value: "swift", compilerId: 85, codeExample: ["// Paste your code here"] },
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
		this.renderPaywall = this.renderPaywall.bind(this);
		this.onFocus = this.onFocus.bind(this);

		this.state = { alertMessage: "" };
	}

	/* Utilities */

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
			let className = index === 0 ? "firstOldLine" : "oldLine";
			this.codeMirrorRef.addLineClass(lineNum, "wrap", className);
		});
		newLines.forEach((lineNum, index) => {
			let className = index === newLines.length - 1 ? "lastNewLine" : "newLine";
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
			this.codeMirrorRef.removeLineClass(oldLine, "wrap", "oldLine");
			this.codeMirrorRef.removeLineClass(oldLine, "wrap", "firstOldLine");
		});
		newLines.forEach((newLine, index) => {
			this.codeMirrorRef.removeLineClass(newLine, "wrap", "newLine");
			this.codeMirrorRef.removeLineClass(newLine, "wrap", "lastNewLine");
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

	renderPaywall() {
		const { isRateLimited } = this.props;

		if (isRateLimited) {
			return (
				<RateLimitMessage className="debugPaywall" />
			)
		}
	}

	/* Event Handlers */

	onFocus() {
		this.codeMirrorRef.focus();
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
			isRateLimited,
			diffs,
			onResolveAllDiffs,
			waitingForDiffResolution,
			onCloseDiffAlert,
			onSetRepoURL,
			repoURL,
			onSelectFile
		} = this.props;
		const { alertMessage } = this.state;

		return (
			<div className="codeEditorContainer">
				<div id="codeEditorContainerWithAlert">
					<div id="codeEditorSubContainer">
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
										cursor: "pointer",
										borderRadius: "5px !important"
									}),
									menu: (provided, state) => ({
										...provided,
										backgroundColor: "#202030"
									}),
									option: (provided, state) => ({
										...provided,
										fontFamily: "Helvetica Neue",
										fontSize: "16px",
										fontWeight: "500",
										backgroundColor: state.isFocused ? "#279AF1" : "transparent",
										cursor: "pointer"
									})
								}}
							/>
							{
								diffs.length !== 0 ? (
									<div id="diffOptions">
										<Button isPrimary id="acceptAllButton" onClick={onResolveAllDiffs}>Accept All</Button>
										<Button isPrimary id="rejectAllButton" onClick={() => onResolveAllDiffs(false)}>Reject All</Button>
									</div>
								) : null
							}
						</div>
						<div id={!isRateLimited ? "codeMirrorContainer" : "rateLimitedCodeMirrorContainer"} onClick={this.onFocus}>
							{this.renderPaywall()}
							<CodeMirror
								className={`codeEditor ${isRateLimited ? "blocked" : ""}`}
								value={code.join("\n")}
								options={{
									mode: language.value,
									theme: "dracula",
									lineNumbers: true
								}}
								onBeforeChange={onChange}
								onChange={onChange}
								editorDidMount={editor => this.codeMirrorRef = editor}
							/>
						</div>
					</div>

					{alertMessage === "" ? null : (<Alert onClose={() => this.setState({ alertMessage: "" })}>{alertMessage}</Alert>)}
					{waitingForDiffResolution ? (<Alert onClose={onCloseDiffAlert}>Please resolve all changes before debugging.</Alert>) : null}
				</div>

				<InputField
					className="inputGithubRepo"
					onSubmit={onSetRepoURL}
					initialValue={repoURL}
					suggestedMessages={[]}
					placeholder="https://github.com/shobrook/adrenaline"
					submitLabel="Import"
				/>
			</div>
		);
	}
}


// TODO: Implement onError to create a suggested message (implement in parent comp)