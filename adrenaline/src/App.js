import React, { Component } from 'react';
import * as Diff from 'diff';
import { Configuration, OpenAIApi } from "openai";

import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import ErrorMessage from "./containers/ErrorMessage";
import ErrorExplanation from "./containers/ErrorExplanation";

import './App.css';

const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
const diffGPTOutput = (inputCode, gptCode) => {
  const diffResults = Diff.diffArrays(inputCode, gptCode);

  let mergedCode = []; let diffs = [];
  let i = 0; let j = -1;
  while (i < diffResults.length) {
    let diffResult = diffResults[i];
    let numLinesChanged = diffResult.value.length;
    let diff = { oldLines: [], mergeLine: -1, newLines: [] }

    // Assumes deletions always come before insertions
    if (diffResult.removed) {
      mergedCode.push(">>>>>>> OLD CODE"); j += 1;
      diff.oldLines.push(j);

      diff.oldLines.push(...range(numLinesChanged, j + 1));
      mergedCode.push(...diffResult.value); j += numLinesChanged;

      mergedCode.push("======="); j += 1;
      diff.mergeLine = j;

      if (i < diffResults.length - 1 && diffResults[i + 1].added) { // Deletion with an insertion
        diff.newLines.push(...range(diffResults[i + 1].value.length, j + 1));
        mergedCode.push(...diffResults[i + 1].value); j += diffResults[i + 1].value.length;

        i += 2;
      } else { // Deletion with no insertion
        i += 1;
      }

      mergedCode.push(">>>>>>> NEW CODE"); j += 1;
      diff.newLines.push(j);

      diffs.push(diff);
      continue;
    } else if (diffResult.added) { // Insertion with no deletion
      mergedCode.push(">>>>>>> OLD CODE"); j += 1;
      diff.oldLines.push(j);

      mergedCode.push("======="); j += 1;
      diff.mergeLine = j;

      diff.newLines.push(...range(numLinesChanged + 1, j + 1));
      mergedCode.push(...diffResult.value); j += numLinesChanged;
      mergedCode.push(">>>>>>> NEW CODE"); j += 1;

      diffs.push(diff);
    } else { // No deletion or insertion
      mergedCode.push(...diffResult.value); j += numLinesChanged;
    }

    i += 1;
  };

  return {
    diffs,
    mergedCode,
  };
}

// TEMP: Testing only
const testInputCode = [
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
let testGPTCode = "def apply_func_to_input(func, input):\n\tfunc(input)\n\ndef main():\n\tmy_data = []\n\tfor i in range(10):\n\t\tapply_func_to_input(my_data.append, i)\n\n\tprint(my_data)\n\nmain()\n";
testGPTCode = testGPTCode.split("\n");
// const testGPTCode = [
//   "def apply_func_to_input(func, input):",
//   "\t# This will apply func to input",
//   "\t(lambda: func(input))()",
//   "",
//   "def main():",
//   "\tmy_data = []",
//   "\tfor i in range(10):",
//   "\t\tapply_func_to_input(my_data.append, i)",
//   "",
//   "\tprint(my_data)",
//   "",
//   "main()"
// ]
const testErrorMessage = `Traceback (most recent call last):
  File "broken.py", line 16, in <module>
    grangercausalitytests(df, maxlag=20)
  File "/Users/jshobrook/Library/Python/3.8/lib/python/site-packages/statsmodels/tsa/stattools.py", line 1532, in grangercausalitytests
    raise InfeasibleTestError(
statsmodels.tools.sm_exceptions.InfeasibleTestError: The Granger causality test statistic cannot be compute because the VAR has a perfect fit of the data.`;

const EDIT_PROMPT_PARAMS = {
  // model: "text-davinci-edit-001",
  model: "code-davinci-edit-001",
  // stop: ["\n\n\n"],
};
const COMPLETION_PROMPT_PARAMS = {
  model: "text-davinci-003",
  max_tokens: 500,
  temperature: 0.2,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  best_of: 1,
  n: 1,
  stream: false,
  // stop: ["\n\n\n"],
};
const DEFAULT_STATE = {
  language: "Python",
  code: testInputCode,
  errorMessage: testErrorMessage,
  diffs: [],
  errorExplanation: "",
  apiKey: ""
};
export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = DEFAULT_STATE;
	}

  /* Event Handlers */

  onCodeChange = (editor, data, code) => this.setState({ code: code.split("\n") });

  onResolveDiff = (linesToDelete, diffIndex, codeMirrorRef, diff) => {
    const { oldLines, newLines, mergeLine } = diff;
    linesToDelete.push(mergeLine);

    // Delete the diff decoration
    oldLines.forEach((oldLine, index) => {
      let className = "oldLine";
      className += index === 0 ? " first" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    newLines.forEach((newLine, index) => {
      let className = "newLine";
      className += index === newLines.length - 1 ? " last" : "";
      codeMirrorRef.removeLineClass(index, "wrap", className);
    });
    codeMirrorRef.removeLineClass(mergeLine, "wrap", "mergeLine");

    // Updates line numbers in codeChange objects after lines are deleted
    let numLinesDeleted = linesToDelete.length;
    let diffs = this.state.diffs.map((diff, index) => {
      if (index <= diffIndex) {
        return diff;
      }

      diff.oldLines = diff.oldLines.map(line => line - numLinesDeleted);
      diff.newLines = diff.newLines.map(line => line - numLinesDeleted);
      diff.mergeLine = diff.mergeLine - numLinesDeleted;

      return diff;
    });
    diffs = diffs.filter((_, index) => index != diffIndex);

    // Update code to reflect accepted or rejected changes
		this.setState(prevState => ({
			code: prevState.code.filter((_, index) => !linesToDelete.includes(index)),
			diffs
		}));
  }

  onDebug = errorMessage => {
    const { code, language, apiKey } = this.state;

    // let gptCode = testGPTCode;
    // let { mergedCode, diffs } = diffGPTOutput(code, gptCode);
    //
    // console.log("diffs");
    // console.log(diffs);
    //
    // this.setState({ code: mergedCode, diffs, errorMessage });

    const apiConfig = new Configuration({ apiKey });
    const api = new OpenAIApi(apiConfig);

    let instruction = `This ${language} code throws an error.`;
    if (errorMessage !== "") {
      instruction += `Here is the error message: ${errorMessage}.`;
    }
    instruction += "Fix it.";

    api
  		.createEdit({
  	    ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
  	  })
  	  .then(data => {
  			let gptCode = data.data.choices[0].text.split("\n");
        let { mergedCode, diffs } = diffGPTOutput(code, gptCode);

        if (errorMessage !== "") {
          let prompt = `Explain the following error message:\n\`\`\`\n${errorMessage}\n\`\`\``;
          api
            .createCompletion({ ...COMPLETION_PROMPT_PARAMS, prompt })
            .then(data => {
              console.log(data);

              let errorExplanation = data.data.choices[0].text;
              this.setState({ code: mergedCode, diffs, errorMessage, errorExplanation });
            }).
            catch(error => console.log(error.response));
        } else {
          this.setState({ code: mergedCode, diffs, errorMessage });
        }
  		})
  		.catch(error => console.log(error.response));
  };

  onSelectLanguage = event => this.setState({ language: event.target.value });

	render() {
    const { language, code, diffs, errorExplanation } = this.state;

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
              language={language}
              onSelectLanguage={this.onSelectLanguage}
            />
            <ErrorMessage onDebug={this.onDebug} />
          </div>
          <ErrorExplanation errorExplanation={errorExplanation} />
        </div>
      </div>
    );
	}
}
