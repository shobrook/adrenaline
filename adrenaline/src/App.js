import React, { Component } from 'react';

import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import ErrorMessage from "./containers/ErrorMessage";
import ErrorExplanation from "./containers/ErrorExplanation";

import './App.css';

// TEMP: Testing only
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
const testErrorMessage = `Traceback (most recent call last):
  File "broken.py", line 16, in <module>
    grangercausalitytests(df, maxlag=20)
  File "/Users/jshobrook/Library/Python/3.8/lib/python/site-packages/statsmodels/tsa/stattools.py", line 1532, in grangercausalitytests
    raise InfeasibleTestError(
statsmodels.tools.sm_exceptions.InfeasibleTestError: The Granger causality test statistic cannot be compute because the VAR has a perfect fit of the data.`;

const DEFAULT_STATE = {
  code: testCode,
  errorMessage: testErrorMessage,
  diffs: [],
  errorExplanation: ""
};
export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

  /* Event Handlers */

  onCodeChange = (editor, data, code) => this.setState({ code: code.split("\n") });

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

  onDebug = () => {
    const { code, errorMessage } = this.state;

    // TODO: Call the OpenAI API
  };

	render() {
    const { code, diffs, errorMessage, errorExplanation } = this.state;

    return (
      <div className="app">
        <Header />
        <div className="body">
          <div className="lhs">
            <CodeEditor
              code={code}
              diffs={diffs}
              onResolveDiff={this.onResolveDiff}
              onChange={this.onCodeChange}
            />
            <ErrorMessage
              errorMessage={errorMessage}
              onDebug={this.onDebug}
            />
          </div>
          <ErrorExplanation errorExplanation={errorExplanation} />
        </div>
      </div>
    );
	}
}
