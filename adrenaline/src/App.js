import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";

import './App.css';

const { ipcRenderer } = window.require("electron");

const SCREENS = {
  OpenFile: 0,
  EditFile: 1
};
const DEFAULT_STATE = {
  filePath: "",
  fileName: "",
  code: [], // Array of strings, each representing a LOC
  codeChanges: [], // Array of {oldLines: [], newLines: []} objects
  stdout: "",
  stderr: "",
  screen: SCREENS.OpenFile
};

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

	/* Event Handlers */

  onOpenFile = () => {
    ipcRenderer.send("openFileRequest");
    ipcRenderer.on("openFileResponse", (event, arg) => {
      const { fileName, filePath, code } = arg;

      this.setState({
          fileName,
          filePath,
          code,
          screen: SCREENS.EditFile
      });
    });
  };

  onRunCommand = command => {
    ipcRenderer.send("runCommandRequest", { command });
    ipcRenderer.on("runCommandResponse", (event, arg) => {
      const { stdout, stderr } = arg;

      this.setState({stdout, stderr});
    });
  }

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

  onRunCode = () => {
    // Get code from state
    ipcRenderer.sendSync("runCodeRequest", {
      // TODO: Error handling for bad filename/paths
      command: filePath + '/' + fileName
    });
    ipcRenderer.on("runCodeResponse", (event, arg) => {
      const { stdOut, stdErr } = arg;
      console.log(`stdout: ${stdOut}`);
      console.log(`stderr: ${stdErr}`);
    });
  }

	render() {
    const { fileName, filePath, codeEditor, code, screen } = this.state;

    let codeChanges = [{oldLines: [3, 4, 5], newLines: [0, 1, 2]}]; // TEMP

    if (screen == SCREENS.OpenFile) {
      return (
        <div className="openFileScreen">
          <OpenFileButton onClick={this.onOpenFile} />
        </div>
      );
    } else if (screen == SCREENS.EditFile) {
      let response = this.onRunCode();
      return (
        <div className="editFileScreen">
          <Header
            fileName={fileName}
            isActive={true}
          />
          <CodeEditor code={code} codeChanges={codeChanges} />
          <Terminal
            filePath={filePath}
            onChange={() => {}}
            onKeyDown={() => {}}
            onSubmit={this.onRunCommand}
          />
        </div>
      );
    }
	}
}

// Terminal window should be collapsable; should have buttons too on the far right (Optimize, Lint, etc.)
