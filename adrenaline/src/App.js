import './App.css';

import React, { Component } from 'react';
import CodeMirror from '@uiw/react-codemirror';
// import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { python } from '@codemirror/lang-python';

// const { ipcRenderer, remote } = window.require("electron");

const SCREENS = {
  OpenFile: 0,
  EditFile: 1
};
const DEFAULT_STATE = {
  filePath: "",
  fileName: "",
  screen: SCREENS.OpenFile
}; // QUESTION: Store code in here? Or in child CodeMirror state?

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

	/* Utilities */

  setFilePath = file => {
    const { name, path } = file;
    this.setState({
      filePath: path,
      fileName: name,
      screen: SCREENS.EditFile
    });
  };

	/* Event Handlers */

  // onFixError = stackTrace => {
  //   // Get code from state
  //   ipcRenderer.sendSync("fixErrorRequest", {
  //     brokenCode: {},
  //     stackTrace: stackTrace
  //   });
  //   ipcRenderer.on("fixErrorResponse", (event, arg) => {
  //     const { fixedCode } = arg;
  //
  //     // TODO: Update state
  //   });
  // }

	render() {
    this.setFilePath({name: "test.py", path: "path/to/test.py"}); // TEMP

    const { fileName, screen } = this.state;

		let appBody;
		if (screen === SCREENS.EditFile) {
			appBody = (
        <div className="editorContainer">
          <CodeMirror
            className="editor"
            value={
`class ThaiBoy(object):
    def __init__(this):
        pass

    def drain(this):
        return this.gang

    @staticmethod
    def gang(that):
        return that(that)

thaiboy = ThaiBoy()
that = thaiboy.drain()
thaiboy.gang(that)
            `}
            extensions={[python()]}
          />
        </div>
      );
		} else if (screen === SCREENS.OpenFile) {
			appBody = (<div />);
		};

		return (
			<div className="app">
				<div className="titlebar">
          <span>{fileName}</span>
        </div>
				{appBody}
			</div>
		);
	}
}
