import React, { Component } from "react";
import {Controlled as CodeMirror} from 'react-codemirror2';
import { aura } from "@uiw/codemirror-theme-aura";

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

import "./CodeEditor.css";

require('codemirror/mode/python/python');

export default class CodeEditor extends Component {
	constructor(props) {
		super(props);

		const { code, codeChanges } = props;

		this.state = {codeChanges, code: code.join("\n")};
		this.codeMirrorRef = null;
	}

	componentDidMount(props) {
		this.state.codeChanges.forEach(codeChange => {
			const { oldLines, newLines } = codeChange;

			oldLines.forEach(lineNum => this.codeMirrorRef.addLineClass(lineNum, "wrap", "oldLine"));
			newLines.forEach(lineNum => this.codeMirrorRef.addLineClass(lineNum, "wrap", "newLine"));
		});
	}

	render() {
		const { code } = this.props;

		return (
			<CodeMirror
			  value={this.state.code}
			  options={{
					mode: "python",
					theme: "dracula",
			    lineNumbers: true
			  }}
			  onBeforeChange={(editor, data, code) => {
			    this.setState({code});
			  }}
			  onChange={(editor, data, value) => {
			  }}
				editorDidMount={(editor) => { this.codeMirrorRef = editor }}
			/>
	  );
	}
}
