import React, { Component } from 'react';
import * as Diff from 'diff';
import { Configuration, OpenAIApi } from "openai";

import Header from "./containers/Header";
import CodeEditor from "./containers/CodeEditor";
import ErrorMessage from "./containers/ErrorMessage";
import ErrorExplanation from "./containers/ErrorExplanation";

import './App.css';

// TODO: Move these into a utilities module
const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
const diffGPTOutput = (inputCode, gptCode) => {
  const diffResults = Diff.diffArrays(inputCode, gptCode);

  let mergedCode = []; let diffs = [];
  let i = 0; let j = -1;
  let currDiffId = 0;
  while (i < diffResults.length) {
    let diffResult = diffResults[i];
    let numLinesChanged = diffResult.value.length;
    let diff = { id: currDiffId, oldLines: [], mergeLine: -1, newLines: [] }

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
      currDiffId++;

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
      currDiffId++;
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
  "\t\tYOOOOO",
  "",
  "\tprint(my_data)",
  "",
  "main()"
];
const testGPTCode = [
  "def apply_func_to_input(func, input):",
  "\t# This will apply func to input",
  "\t(lambda: func(input))()",
  "",
  "def main():",
  "\tmy_data = []",
  "\tfor i in range(10):",
  "\t\tapply_func_to_input(my_data.append, i)",
  "",
  "\tprint(my_data)",
  "",
  "main()"
]
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

    this.onCodeChange = this.onCodeChange.bind(this);
    this.onResolveDiff = this.onResolveDiff.bind(this);
    this.onDebug = this.onDebug.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);

		this.state = DEFAULT_STATE;
	}

  /* Event Handlers */

  onCodeChange(editor, data, newCode) {
    const { code, diffs } = this.state;
    newCode = newCode.split("\n")

    if (code.length !== newCode.length) {
      const { from, text, to } = data;

      if (from.line === to.line) { // Insertion
        let insertLine = from.line;
        let numLinesAdded = text.length - 1;

        diffs.forEach(diff => {
          const { oldLines, mergeLine, newLines } = diff;
          const lastLineInDiff = newLines.at(-1);

          // Insertions don't affect diffs *before* the insertLine
          if (lastLineInDiff < insertLine) {
            return;
          }

          if (oldLines.includes(insertLine)) { // Change occurred in old code
            let lastOldLine = oldLines.at(-1)
            diff.oldLines.push(...range(numLinesAdded, lastOldLine + 1));

            diff.mergeLine += numLinesAdded;
            diff.newLines = newLines.map(line => line + numLinesAdded);
          } else if (mergeLine === insertLine || newLines.includes(insertLine)) { // Change occurred in new code
            let lastNewLine = newLines.at(-1);
            diff.newLines = newLines.push(...range(numLinesAdded, lastNewLine + 1))
          } else { // Change occurred outside of diff
            diff.oldLines = oldLines.map(line => line + numLinesAdded);
            diff.mergeLine += numLinesAdded;
            diff.newLines = newLines.map(line => line + numLinesAdded);
          }
        });
      } else if (from.line < to.line) { // Deletion
        let deleteLine = to.line;
        let numLinesDeleted = to.line - from.line;

        diffs.forEach(diff => {
          const { oldLines, mergeLine, newLines } = diff;
          const lastLineInDiff = newLines.at(-1);

          // Deletions don't affect diffs *before* the deleteLine
          if (lastLineInDiff < deleteLine) {
            return;
          }

          if (oldLines.includes(deleteLine)) { // Change occurred in old code
            let deleteStartIndex = oldLines.indexOf(from.line);
            let deleteEndIndex = oldLines.indexOf(to.line);

            // TODO: Delete lines in oldLines from start to end index
            // TODO: Decrement lines following the one at end index

            // let indexOfDeleteLine = oldLines.indexOf(deleteLine);
            // diff.oldLines = oldLines.filter((line, index) => index > indexOfDeleteLine || index <= indexOfDeleteLine - numLinesDeleted).map(line => line - numLinesDeleted);
            // diff.mergeLine -= numLinesDeleted;
            // diff.newLines = newLines.map(line => line - numLinesDeleted);
          } else if (mergeLine === deleteLine) {
            // TODO: Delete the diff
          } else if (newLines.includes(deleteLine)) { // Change occurred in new code
            let indexOfDeleteLine = newLines.indexOf(deleteLine);

            // TODO: If deletion extends to or past mergeLine, then delete the whole diff
          } else { // Change occurred outside of diff
            diff.oldLines = oldLines.map(line => line - numLinesDeleted);
            diff.mergeLine -= numLinesDeleted;
            diff.newLines = newLines.map(line => line - numLinesDeleted);
          }
        });
      }

      console.log(data);
    }

    this.setState({ code: newCode, diffs });
  }

  onResolveDiff(diff, linesToDelete) {
    const { code, diffs } = this.state;
    const { id: diffId, oldCodeWidget, newCodeWidget } = diff;

    // Delete widgets from editor
    oldCodeWidget.clear();
    newCodeWidget.clear();

    let numLinesDeleted = linesToDelete.length;
    let updatedDiffs = diffs.map((otherDiff, index) => {
      const {
        id: otherDiffId,
        oldLines,
        newLines,
        mergeLine
      } = otherDiff;

      // If diff comes before one that was resolved, no line update needed
      if (otherDiffId <= diffId) {
        return otherDiff;
      }

      // Updates line numbers in codeChange objects after lines are deleted
      otherDiff.oldLines = oldLines.map(line => line - numLinesDeleted);
      otherDiff.newLines = newLines.map(line => line - numLinesDeleted);
      otherDiff.mergeLine = mergeLine - numLinesDeleted;

      return otherDiff;
    }).filter(otherDiff => otherDiff.id != diffId);
    let updatedCode = code.filter((_, index) => !linesToDelete.includes(index));

    this.setState({ code: updatedCode, diffs: updatedDiffs });
  }

  onDebug(errorMessage) {
    const { code, language, apiKey } = this.state;

    let gptCode = testGPTCode;
    let { mergedCode, diffs } = diffGPTOutput(code, gptCode);

    this.setState({ code: mergedCode, diffs, errorMessage });

    // const apiConfig = new Configuration({ apiKey });
    // const api = new OpenAIApi(apiConfig);
    //
    // let instruction = `This ${language} code throws an error.`;
    // if (errorMessage !== "") {
    //   instruction += `Here is the error message: ${errorMessage}.`;
    // }
    // instruction += "Fix it.";
    //
    // api
  	// 	.createEdit({
  	//     ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
  	//   })
  	//   .then(data => {
    //     let inputCode = code.join("\n").trim().split("\n");
  	// 		let gptCode = data.data.choices[0].text.trim().split("\n");
    //     let { mergedCode, diffs } = diffGPTOutput(inputCode, gptCode);
    //
    //     if (errorMessage !== "") {
    //       let prompt = `Explain the following error message:\n\`\`\`\n${errorMessage}\n\`\`\``;
    //       api
    //         .createCompletion({ ...COMPLETION_PROMPT_PARAMS, prompt })
    //         .then(data => {
    //           console.log(data);
    //
    //           let errorExplanation = data.data.choices[0].text;
    //           this.setState({ code: mergedCode, diffs, errorMessage, errorExplanation });
    //         }).
    //         catch(error => console.log(error.response));
    //     } else {
    //       this.setState({ code: mergedCode, diffs, errorMessage });
    //     }
  	// 	})
  	// 	.catch(error => console.log(error.response));
  };

  onSelectLanguage(event) { this.setState({ language: event.target.value }); }

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
