import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";

import './App.css';

const { ipcRenderer } = window.require("electron");

const DEFAULT_STATE = {
  fileName: "test_program.py", // TEMP
  filePath: "test_program.py", // TEMP
  code: [
    "def main():",
    "\targs = sys.argv",
    "\tif len(args) == 1 or args[1].lower() in (\"-h\", \"--help\"):",
    "\t\tprinters.print_help_message()",
    "\t\treturn",
    "",
    "\tlanguage = parsers.get_language(args)",
    "\tif not language:",
    "\t\tprinters.print_invalid_language_message()",
    "\t\treturn"
  ], // TEMP
  codeChanges: [{oldLines: [3, 4, 5], newLines: [0, 1, 2]}], // TEMP
  stdout: "",
  stderr: ""
};

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

	/* Event Handlers */

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
    const { fileName, filePath } = this.state;
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

  onClickUseMe = (linesToDelete, codeChangeIndex, codeMirrorRef, codeChange) => {
    // Delete the diff decoration
    // this.state.diffWidgets[codeChangeIndex].clear();
    codeChange.oldLines.map((oldLine, index) => {
      let className = "oldLine";
      className += index === codeChange.oldLines.length - 1 ? " last" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    codeChange.newLines.map((newLine, index) => {
      let className = "newLine";
      className += index === 0 ? " first" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });

    // Update code to reflect accepted or rejected changes
		this.setState(prevState => ({
			code: prevState.code.filter((_, index) => !linesToDelete.includes(index)),
			codeChanges: prevState.codeChanges.filter((_, index) => index != codeChangeIndex)
		}));

    // TODO: Do we need to update the line numbers in all the other codeChange objects?
  }

	render() {
    const { fileName, filePath, codeEditor, code, codeChanges, screen } = this.state;

    return (
      <div className="app">
        <Header
          fileName={fileName}
          isActive={true}
        />
        <CodeEditor
          code={code}
          codeChanges={codeChanges}
          onChange={(editor, data, strCode) => { console.log(strCode); this.setState({code: strCode.split("\n")})}}
          onClickUseMe={this.onClickUseMe}
        />
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
