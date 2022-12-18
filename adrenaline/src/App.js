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
  isCodeBroken: false
};

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}



  onRunCommand = command => {
    const { fileName, currDir } = this.state;

    if (command.trim() === "") {
      return;
    }

    let runCommandRequest;
    let commandParts = command.split(" ");
    if (commandParts.length > 1) { // Changes file references in command to absolute paths
      // TODO: Validate that commandParts[1] is actually a file
      let filePath = `${currDir}/${commandParts[1]}`;
      runCommandRequest = {
        command: `${commandParts[0]} ${filePath} ${commandParts.slice(2, commandParts.length)}`
      }
    } else {
      runCommandRequest = { command }
    }

    ipcRenderer.send("runCommandRequest", runCommandRequest);
    ipcRenderer.on("runCommandResponse", (event, arg) => {
      const { stdout, stderr } = arg;

      let isCodeBroken = false;
      if (commandParts.length > 1 && commandParts[1] == fileName) {
        isCodeBroken = stderr.length !== 0;
      }

      this.setState({stdout, stderr, isCodeBroken});
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

    // TODO: Update the line numbers in all the other codeChange objects?
  }

  // FOR MALIK
  // fixedCodeStr should be a string representing the NEW code.
  // Merge the fixedCode with the current code (this.state.code). The fixed
  // lines should be inserted above the old lines. Separators should also
  // be added to delineate between fixed and old code. Here's an example:

    /* OLD CODE: */

    // x = 10
    // y = "hey"
    // z = "yo"
    // result = x + y + z
    // print("What's up")

    /* FIXED CODE */

    // x = 10
    // y = 20
    // z = 30
    // result = x + y + z
    // print(result)

    /* MERGED CODE */

    // x = 10
    // >>>FIXED CODE<<<
    // y = 20
    // z = 30
    // ================
    // y = "hey"
    // z = "yo"
    // >>>OLD CODE<<<
    // result = x + y + z
    // >>>FIXED CODE<<<
    // print(result)
    // ================
    // print("What's up")
    // >>>OLD CODE<<<

    // x = 10
    // >>>OLD CODE<<<
    // y = "hey"
    // z = "yo"
    // ================
    // y = 20
    // z = 30
    // >>>FIXED CODE<<<
    // result = x + y + z
    // >>>OLD CODE<<<
    // print("What's up")
    // ================
    // print(result)
    // >>>FIXED CODE<<<

  // Once you do this, set this.state.code to this new code. Then set
  // this.state.codeChanges to be a list of "changedCode" objects, each
  // indexing the old lines of code and the new lines of code. For the example
  // above, this would look like:

    // codeChanges = [
    //    {oldLines: [5, 6, 7], newLines: [1, 2, 3]},
    //    {oldLines: [12, 13], newLines: [9, 10]}
    // ]


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
      //const { mergedCodeStr, codeChanges } = this.diffCode(testBrokenCodeStr, testFixedCodeStr);
      //console.log("merged code: \n", mergedCodeStr)
      //console.log("code changes: ", codeChanges)
    });
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
      isCodeBroken
    } = this.state;
    return (
      <div className="app">
        <Header
          fileName={fileName}
          isActive={true}
        />
        <CodeEditor
          code={code}
          codeChanges={codeChanges}
          onChange={(editor, data, strCode) => this.setState({code: strCode.split("\n")})}
          onClickUseMe={this.onResolveDiff}
        />
        <Terminal
          currDir={currDir}
          onChange={() => {}}
          onKeyDown={() => {}}
          stdout={stdout}
          stderr={stderr}
          isCodeBroken={isCodeBroken}
          onSubmit={this.onRunCommand}
          onClickFixIt={this.onFixCode}
        />
      </div>
    );
	}
}
