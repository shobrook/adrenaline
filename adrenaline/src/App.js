import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";

import './App.css';

const { ipcRenderer } = window.require("electron");

const testCode = [
  "import numpy as np",
  "import pandas as pd",
  "",
  "from statsmodels.tsa.stattools import grangercausalitytests",
  "",
  "n = 1000",
  "ls = np.linspace(0, 2*np.pi, n)",
  "",
  "df1 = pd.DataFrame(np.sin(ls))",
  "df2 = pd.DataFrame(2*np.sin(1+ls))",
  "",
  "df = pd.concat([df1, df2], axis=1)",
  "",
  "df.plot()",
  "",
  "grangercausalitytests(df, maxlag=20)"
];
const testStackTrace = `Traceback (most recent call last):
  File "broken.py", line 16, in <module>
    grangercausalitytests(df, maxlag=20)
  File "/Users/jshobrook/Library/Python/3.8/lib/python/site-packages/statsmodels/tsa/stattools.py", line 1532, in grangercausalitytests
    raise InfeasibleTestError(
statsmodels.tools.sm_exceptions.InfeasibleTestError: The Granger causality test statistic cannot be compute because the VAR has a perfect fit of the data.`;

const DEFAULT_STATE = {
  fileName: "test_program.py", // TEMP
  currDir: "~/Development/adrenaline/adrenaline/", // TEMP
  code: testCode, // TEMP
  codeChanges: [{oldLines: [3, 4, 5], newLines: [0, 1, 2]}], // TEMP
  stdout: "",
  stderr: "", // TEMP
  enableFixIt: false
};

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
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

  onRunCommand = command => {
    // Get code from state
    const { fileName, currDir } = this.state;
    // TODO: Error handling for bad filename/paths
    if (command === '') return;
    let commandParts = command.split(" ");
    let _command = command;
    if (commandParts > 1) {
      let filePath = this.state.currDir + commandParts[1];
      _command = [commandParts[0], filePath, ...commandParts.slice(1)].join(" ")
    }
    ipcRenderer.send("runCommandRequest", {
      command: _command
    });
    console.log("Sent runCommandRequest");
    ipcRenderer.on("runCommandResponse", (event, arg) => {
      console.log("Received runCommandResponse");

      const { stdout, stderr } = arg;
      let enableFixIt = false;
      if (command.split(" ").length >1 && command.split(" ")[1] == this.state.fileName) {
        enableFixIt = !stderr.isEmpty();
      }

      this.setState({stdout, stderr, enableFixIt});
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log(`should fix: ${this.state.enableFixIt}`);

    });
  }

  onResolveDiff = (linesToDelete, codeChangeIndex, codeMirrorRef, codeChange) => {
    // Delete the diff decoration
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

  onFixCode = () => {
    const { code, stderr } = this.state;

    ipcRenderer.sendSync("fixErrorRequest", {
      code: code,
      stackTrace: stderr
    });
    ipcRenderer.on("fixErrorResponse", (event, arg) => {
      const { fixedCode } = arg;
      console.log(fixedCode);
    })
  }

	render() {
    const { fileName, currDir, codeEditor, code, codeChanges, screen } = this.state;

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
          onClickUseMe={this.onResolveDiff}
        />
        <Terminal
          currDir={currDir}
          onChange={() => {}}
          onKeyDown={() => {}}
          stdout={this.state.stdout}
          stderr={this.state.stderr}
          enableFixIt={this.state.enableFixIt}
          onSubmit={this.onRunCommand}
          onClickFixIt={this.onFixCode}
        />
      </div>
    );
	}
}
