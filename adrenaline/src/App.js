import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";

import './App.css';

// const electron = require('electron');
// const ipcRenderer = electron.ipcRenderer;
// import { ipcRenderer } from 'electron';
// const { ipcRenderer, remote } = window.require("electron");
// const ipcRenderer = window.require('electron').ipcRenderer;

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

  onClickOpenFile = () => {
    // const { name, path } = file;
    this.setState({
      filePath: "test.py", // TEMP
      fileName: "test.py", // TEMP
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
    const code = `
    class ThaiBoy(object):
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
`;

    const { fileName, filePath, screen } = this.state;

    if (screen == SCREENS.OpenFile) {
      return (
        <div className="openFileScreen">
          <OpenFileButton onClick={this.onClickOpenFile} />
        </div>
      );
    } else if (screen == SCREENS.EditFile) {
      return (
        <div className="editFileScreen">
          <Header
            fileName={fileName}
            filePath={filePath}
            isActive={true}
          />
          <CodeEditor code={code} />
          <Terminal />
        </div>
      );
    }
	}
}

// Terminal window should be collapsable; should have buttons too on the far right (Optimize, Lint, etc.)
