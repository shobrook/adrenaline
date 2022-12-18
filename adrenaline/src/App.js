import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";

import './App.css';

const { ipcRenderer } = window.require("electron");

const testCode = [
  "def apply_func_to_input(func, input):",
  "\tfunc(input)",
  "",
  "def main():",
  "\tmy_data = []",
  "\tfor i in range(10):",
  "\t\tapply_func_to_input(my_data.add, i)",
  "",
  "\tprint(my_data)",
  "",
  "main()"
];
const testStackTrace = `Traceback (most recent call last):
  File "broken.py", line 16, in <module>
    grangercausalitytests(df, maxlag=20)
  File "/Users/jshobrook/Library/Python/3.8/lib/python/site-packages/statsmodels/tsa/stattools.py", line 1532, in grangercausalitytests
    raise InfeasibleTestError(
statsmodels.tools.sm_exceptions.InfeasibleTestError: The Granger causality test statistic cannot be compute because the VAR has a perfect fit of the data.`;

const DEFAULT_STATE = {
  fileName: "test_program.py", // TEMP
  currDir: "Projects/adrenaline/adrenaline", // TEMP
  code: testCode, // TEMP
  codeChanges: [], // TEMP
  stdout: "",
  stderr: "", // TEMP
  isCodeBroken: false,
  terminalHistory: [],
  isUnsaved: false
};

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

  onRunCommand = command => {
    const { currDir } = this.state;

    ipcRenderer.send("runCommandRequest", { currDir, command });
  }

  onResolveDiff = (linesToDelete, codeChangeIndex, codeMirrorRef, codeChange) => {
    const { oldLines, newLines, mergeLine } = codeChange;
    linesToDelete.push(mergeLine);

    // Delete the diff decoration
    oldLines.map((oldLine, index) => {
      let className = "oldLine";
      className += index === 0 ? " first" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    newLines.map((newLine, index) => {
      let className = "newLine";
      className += index === codeChange.newLines.length - 1 ? " last" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");

    // Updates line numbers in codeChange objects after lines are deleted
    let numLinesDeleted = linesToDelete.length;
    let codeChanges = this.state.codeChanges.map((_codeChange, index) => {
      if (index <= codeChangeIndex) {
        return _codeChange;
      }

      _codeChange.oldLines = _codeChange.oldLines.map(line => line - numLinesDeleted);
      _codeChange.newLines = _codeChange.newLines.map(line => line - numLinesDeleted);
      _codeChange.mergeLine = _codeChange.mergeLine -= numLinesDeleted;

      return _codeChange;
    });
    codeChanges = codeChanges.filter((_, index) => index != codeChangeIndex);

    // Update code to reflect accepted or rejected changes
		this.setState(prevState => ({
			code: prevState.code.filter((_, index) => !linesToDelete.includes(index)),
			codeChanges
		}));
  }

  onFixCode = () => {
    const { code, stderr } = this.state;

    ipcRenderer.send("fixErrorRequest", {
      code: code.join("\n"),
      stackTrace: stderr
    });
  }

  onLintCode = () => {
    const { code } = this.state;

    ipcRenderer.send("lintCodeRequest", { code: code.join("\n") });
  }

  onOptimizeCode = () => {
    const { code } = this.state;

    ipcRenderer.send("optimizeCodeRequest", { code: code.join("\n") });
  }

  onDocumentCode = () => {
    const { code } = this.state;

    ipcRenderer.send("documentCodeRequest", { code: code.join("\n") });
  }

  onSaveFile = () => {
    const { code, fileName, currDir } = this.state;
    const filePath = `${currDir}/${fileName}`;

    ipcRenderer.send("saveFileRequest", { code, filePath })
  }

  /* Response Handlers */

  handleCodeChangeResponse = (event, arg) => {
    const { mergedCode, codeChanges } = arg;

    console.log("got response")
    this.setState({ code: mergedCode.split("\n"), codeChanges });
  }

  componentDidMount() {
    ipcRenderer.on("runCommandResponse", (event, arg) => {
      const { fileName } = this.state;
      const { command, stdout, stderr } = arg;

      // NOTE: Hacky, shouldn't have to return command in the

      // let isCodeBroken = false;
      // let commandParts = command.split(" ")
      // if (commandParts.length > 1 && commandParts[1].endsWith(fileName)) {
      //   isCodeBroken = stderr.length !== 0;
      // }
      let isCodeBroken = stderr.length !== 0;

      let commandAndOutput = { command, stdout, stderr };
      this.setState(prevState => ({
          stdout,
          stderr,
          isCodeBroken,
          terminalHistory: prevState.terminalHistory.concat(commandAndOutput)
      }));
    });

    ipcRenderer.on("saveFileResponse", (event, arg) => {
      const { success } = arg;

      console.log(success)
      // TODO: Show error message if saving fails
      this.setState({isUnsaved: !success});
    });

    ipcRenderer.on("fixErrorResponse", this.handleCodeChangeResponse);
    ipcRenderer.on("lintCodeResponse", this.handleCodeChangeResponse);
    ipcRenderer.on("optimizeCodeResponse", this.handleCodeChangeResponse);
    ipcRenderer.on("documentCodeResponse", this.handleCodeChangeResponse);
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners();
  }

	render() {
    const {
      fileName,
      currDir,
      codeEditor,
      code,
      codeChanges,
      stdout,
      stderr,
      isCodeBroken,
      terminalHistory,
      isUnsaved
    } = this.state;

    return (
      <div className="app">
        <Header
          fileName={fileName}
          isUnsaved={isUnsaved}
          onLintCode={this.onLintCode}
          onOptimizeCode={this.onOptimizeCode}
          onDocumentCode={this.onDocumentCode}
        />
        <CodeEditor
          code={code}
          codeChanges={codeChanges}
          onChange={strCode => this.setState({code: strCode.split("\n"), isUnsaved: true})}
          onClickUseMe={this.onResolveDiff}
          onSaveFile={this.onSaveFile}
        />
        <Terminal
          currDir={currDir}
          onChange={() => {}}
          onKeyDown={() => {}}
          stdout={stdout}
          stderr={stderr}
          isCodeBroken={isCodeBroken}
          onSubmit={this.onRunCommand}
          onFixCode={this.onFixCode}
          history={terminalHistory}
        />
      </div>
    );
	}
}
