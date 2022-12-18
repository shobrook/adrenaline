import React, { Component } from 'react';

import OpenFileButton from "./components/OpenFileButton";
import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import Terminal from "./containers/Terminal";
import * as Diff from 'diff';

import './App.css';

const { ipcRenderer } = window.require("electron");

const testCode = [
  "import numpy as np",
  "import pandas as pd",
  "from statsmodels.tsa.stattools import grangercausalitytests",
  "",
  "n = 1000",
  "ls = np.linspace(0, 2*np.pi, n)",
  "==========",
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
  currDir: "Projects/adrenaline/adrenaline", // TEMP
  code: testCode, // TEMP
  codeChanges: [{oldLines: [7, 8], newLines: [4, 5], mergeLine: 6}], // TEMP
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
      className += index === codeChange.oldLines.length - 1 ? " last" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    newLines.map((newLine, index) => {
      let className = "newLine";
      className += index === 0 ? " first" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");

    // Update code to reflect accepted or rejected changes
		this.setState(prevState => ({
			code: prevState.code.filter((_, index) => !linesToDelete.includes(index)),
			codeChanges: prevState.codeChanges.filter((_, index) => index != codeChangeIndex)
		}));

    // TODO: Update the line numbers in all the other codeChange objects?
  }

  onFixCode = () => {
    const { code, stderr } = this.state;
    console.log("onfixcode")

    //Testing
    var testBrokenCodeStr = `
      def apply_input_to_func(func, input):
          func(input)

      def main():
          my_data = []
          their_data = []
          for i in range(10):
              apply_input_to_func(my_data.append, i)
              their_data.add(i)

          print(my_data)

      main()
    `
    testBrokenCodeStr = `
      x = 10
      y = "hey"
      z = "yo"
      result = x + y + z
      print("What's up")
    `
    var testFixedCodeStr = `
      def apply_input_to_func(func, input):
          func(input)
          // this is some new shit

      def main():
          my_data = []
          for i in range(10):
              apply_input_to_func(my_data.append, i)

          print(my_data)

      main()
    `
    testFixedCodeStr = `
      x = 10
      y = 20
      z = 30
      result = x + y + z
      print(result)
    `
    console.log("broken code: \n", testBrokenCodeStr)
    //const { mergedCodeStr, codeChanges } = this.diffCode(testBrokenCodeStr, testFixedCodeStr);
    const diff = Diff.diffTrimmedLines(testBrokenCodeStr, testFixedCodeStr);
    var mergedCode = ""


    for(let i=0; i< diff.length; i++){
      let part = diff[i];
      console.log("diff value: ", part.value)
      console.log("diff added: ", part.added)
      console.log("diff removed: ", part.removed)

      if (!part.added && !part.removed) {
        mergedCode += part.value;

      } else if (part.removed) {

        mergedCode += '>>>OLD CODE<<<\n';

        for (let j = 0; j < part.value.length; j++) {
          mergedCode += part.value[j];
        }
        mergedCode += "================\n"

      } else if (part.added) {
        for (let j = 0; j < part.value.length; j++) {
          mergedCode += part.value[j];
        }
        mergedCode += '>>>FIXED CODE<<<\n'

      }
    }
    console.log("final merged code: ", mergedCode)
    const codeChanges = [];
    const lines = mergedCode.split('\n');

    let oldLines = [];
    let newLines = [];
    let mergeLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('>>>OLD CODE<<<')) {
        oldLines.push(i);
      } else if (line.includes('>>>FIXED CODE<<<')) {
        newLines.push(i);
      } else if (line.includes('===============')) {
        mergeLine = i;
      }

      if (oldLines.length > 0 && newLines.length > 0 && mergeLine > -1) {
        for (let j = oldLines[0]+1; j < mergeLine; j++) {
          oldLines.push(j);
        }
        for (let k = mergeLine+1; k < newLines[0]; k++) {
          newLines.push(k);
        }
        codeChanges.push({ oldLines, newLines, mergeLine });
        oldLines = [];
        newLines = [];
        mergeLine = -1;
      }
    }

    codeChanges.forEach( (codeChange) => {
  		console.log("\tlines added: ", codeChange.newLines)
  		console.log("\tlines removed: ", codeChange.oldLines)
  		console.log("\tmed line: ", codeChange.mergeLine)
    })
    ipcRenderer.sendSync("fixErrorRequest", {
      code: code,
      stackTrace: stderr
    });
  }

  onSaveFile = () => {
    const { code, fileName, currDir } = this.state;
    const filePath = `${currDir}/${fileName}`;

    ipcRenderer.send("saveFileRequest", { code, filePath })
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

    ipcRenderer.on("fixErrorResponse", (event, arg) => {
      const { fixedCodeStr } = arg;
      //Testing
      const testBrokenCodeStr = `
        def apply_input_to_func(func, input):
            func(input)

        def main():
            my_data = []
            their_data = []
            for i in range(10):
                apply_input_to_func(my_data.append, i)
                their_data.add(i)

            print(my_data)

        main()
      `
      const testFixedCodeStr = `
        def apply_input_to_func(func, input):
            func(input)
            // this is some new shit

        def main():
            my_data = []
            for i in range(10):
                apply_input_to_func(my_data.append, i)

            print(my_data)

        main()
        `
      console.log("broken code: \n", testBrokenCodeStr)

    });

    ipcRenderer.on("saveFileResponse", (event, arg) => {
      const { success } = arg;

      console.log(success)
      // TODO: Show error message if saving fails
      this.setState({isUnsaved: !success});
    })
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
        />
        <CodeEditor
          code={code}
          codeChanges={codeChanges}
          onChange={(editor, data, strCode) => this.setState({code: strCode.split("\n"), isUnsaved: true})}
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
