import React, { Component, Fragment } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

import "./CodeEditor.css";

export default class CodeEditor extends Component {
	constructor(props) {
    super(props);

    this.codeMirrorRef = React.createRef();
	}

	componentDidMount(props) {
		const { codeChanges } = this.props;

		let codeIsRendered = false;
		const interval = setInterval(() => {
			if (codeIsRendered) {
				clearInterval(interval);
			}

			let linesOfCode = this.codeMirrorRef.current.editor.getElementsByClassName("cm-line");

			if (linesOfCode.length == 0) {
				return;
			}

			codeIsRendered = true;
			codeChanges.forEach(codeChange => {
				const { oldLines, newLines } = codeChange;

				Array.from(linesOfCode).forEach((lineOfCode, index, _) => {
					if (oldLines.includes(index)) {
						lineOfCode.className = "cm-line oldLine";
					} else if (newLines.includes(index)) {
						lineOfCode.className = "cm-line newLine";
					}
				});
			});
	  }, 100);
	}

	render() {
    const { code, codeChanges } = this.props;


    return (
			<Fragment>
      <CodeMirror
				ref={this.codeMirrorRef}
        className="editor"
        value={code.join("\n")}
				extensions={[python()]}
        onChange={(editor, data, value) => {
          this.setState({});
        }}
      />
			</Fragment>
    );
	}
}
