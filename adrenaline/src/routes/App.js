import React, { Component, Fragment } from 'react';
import { Configuration, OpenAIApi } from "openai";

import { OLD_CODE_LABEL, FIXED_CODE_LABEL, range, diffGPTOutput } from "../utilities";

import Popup from "../components/Popup";
import Header from "../containers/Header";
import CodeEditor from "../containers/CodeEditor";
import ErrorMessage from "../containers/ErrorMessage";
import ErrorExplanation from "../containers/ErrorExplanation";

import './App.css';

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
const testGPTCode = [
  "import numpy as np",
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
const testErrorExplanation = "The component also uses the split function to split the text into an array of words, and then uses the slice function to select a subset of the array up to the currentWordIndex. It then uses the join function to join this subset of words back into a single string of text, which is then rendered using the div element.";

const EDIT_PROMPT_PARAMS = {
  model: "code-davinci-edit-001"
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
  stream: false
};

export default class App extends Component {
	constructor(props) {
		super(props);

    this.onCodeChange = this.onCodeChange.bind(this);
    this.onResolveDiff = this.onResolveDiff.bind(this);
    this.onDebug = this.onDebug.bind(this);
    this.onLint = this.onLint.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
    this.onOpenPopup = this.onOpenPopup.bind(this);
    this.onSetAPIKey = this.onSetAPIKey.bind(this);
    this.onClosePopup = this.onClosePopup.bind(this);
    this.onSetPopupRef = this.onSetPopupRef.bind(this);

		this.state = {
      language: {label: "Python", value: "python"},
      code: testInputCode,
      errorMessage: "",
      diffs: [],
      errorExplanation: "",
      apiKey: "",
      waitingForCodeFix: false,
      waitingForCodeLint: false,
      askForAPIKey: false
    };

    const apiKey = localStorage.getItem("openAiApiKey");
    if (apiKey) {
      this.state.apiKey = JSON.parse(apiKey);
    }
	}

  componentDidUpdate(prevProps, prevState) {
    const { prevApiKey } = prevState;
    const { apiKey } = this.state;

    if (prevApiKey !== apiKey) {
      localStorage.setItem("openAiApiKey", JSON.stringify(apiKey));
    }
  }

  /* Event Handlers */

  onCodeChange(editor, data, newCode) {
    const { code, diffs } = this.state;
    newCode = newCode.split("\n")

    // Lines were either inserted or deleted, requiring an update in diff indexing
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
            diff.newLines.push(...range(numLinesAdded, lastNewLine + 1))
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

            diff.oldLines = oldLines.map((line, index) => {
              if (index > deleteEndIndex) {
                return line - numLinesDeleted;
              }

              return line;
            });

            if (deleteStartIndex === -1) {
              diff.oldLines.splice(0, deleteEndIndex + 1);
            } else {
              diff.oldLines.splice(deleteStartIndex + 1, deleteEndIndex - deleteStartIndex);
            }

            diff.mergeLine -= numLinesDeleted;
            diff.newLines = newLines.map(line => line - numLinesDeleted);
          } else if (mergeLine === deleteLine) {
            // TODO: Delete entire diff if merge line is deleted
            return;
          } else if (newLines.includes(deleteLine)) { // Change occurred in new code
            let deleteStartIndex = newLines.indexOf(from.line);
            let deleteEndIndex = newLines.indexOf(to.line);

            diff.newLines = newLines.map((line, index) => {
              if (index > deleteEndIndex) {
                return line - numLinesDeleted;
              }

              return line;
            });

            if (deleteStartIndex === -1) { // Deletion extends beyond merge line
              diff.newLines.splice(0, deleteEndIndex + 1);
              // TODO: Delete entire diff if merge line is deleted
            } else {
              diff.newLines.splice(deleteStartIndex + 1, deleteEndIndex - deleteStartIndex);
            }
          } else { // Change occurred outside of diff
            diff.oldLines = oldLines.map(line => line - numLinesDeleted);
            diff.mergeLine -= numLinesDeleted;
            diff.newLines = newLines.map(line => line - numLinesDeleted);
          }
        });
      }
    }

    this.setState({ code: newCode, diffs });
  }

  onResolveDiff(diff, linesToDelete, indicatorLineNum) {
    const { code, diffs } = this.state;
    const { id: diffId, oldCodeWidget, newCodeWidget } = diff;

    if (indicatorLineNum !== undefined) {
      let line = code[indicatorLineNum];

      if (line === OLD_CODE_LABEL || line === FIXED_CODE_LABEL) {
        linesToDelete.push(indicatorLineNum);
      }
    }

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

    if (apiKey === "") {
      this.setState({ askForAPIKey: true });
      return;
    } else {
      this.setState({ waitingForCodeFix: true });
    }

    let { mergedCode, diffs } = diffGPTOutput(testInputCode, testGPTCode);
    this.setState({ waitingForCodeFix: false, code: mergedCode, diffs, errorMessage });

    // const apiConfig = new Configuration({ apiKey });
    // const api = new OpenAIApi(apiConfig);
    //
    // let instruction = `Fix this error: ${errorMessage}`;
    //
    // api
  	// 	.createEdit({
  	//     ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
  	//   })
  	//   .then(data => {
    //     let inputCode = code.join("\n").trim().split("\n");
  	// 		let gptCode = data.data.choices[0].text.trim().replace("    ", "\t").split("\n");
    //     let { mergedCode, diffs } = diffGPTOutput(inputCode, gptCode);
    //
    //     if (errorMessage !== "") {
    //       let prompt = `Explain the following error message:\n\`\`\`\n${errorMessage}\n\`\`\``;
    //       api
    //         .createCompletion({ ...COMPLETION_PROMPT_PARAMS, prompt })
    //         .then(data => {
    //           let errorExplanation = data.data.choices[0].text;
    //           this.setState({
    //             waitingForCodeFix: false,
    //             code: mergedCode,
    //             diffs,
    //             errorMessage,
    //             errorExplanation
    //           });
    //         }).
    //         catch(error => console.log(error.response));
    //     } else {
    //       this.setState({
    //         waitingForCodeFix: false,
    //         code: mergedCode,
    //         diffs,
    //         errorMessage
    //       });
    //     }
  	// 	})
  	// 	.catch(error => console.log(error.response));
  };

  onLint() {
    const { code, language, apiKey } = this.state;

    if (apiKey === "") {
      this.setState({ askForAPIKey: true });
      return;
    } else {
      this.setState({ waitingForCodeLint: true });
    }

    const apiConfig = new Configuration({ apiKey });
    const api = new OpenAIApi(apiConfig);

    let instruction = `Identify and fix all bugs in this ${language.label} code.`;

    api
      .createEdit({
        ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
      })
      .then(data => {
        let inputCode = code.join("\n").trim().split("\n");
        let gptCode = data.data.choices[0].text.trim().replace("    ", "\t").split("\n");
        let { mergedCode, diffs } = diffGPTOutput(inputCode, gptCode);

        this.setState({
          waitingForCodeLint: false,
          code: mergedCode,
          diffs
        });
      })
      .catch(error => {
        this.setState({ waitingForCodeLint: false });
      });
  }

  onSelectLanguage(language) { this.setState({ language }); }

  onOpenPopup() { this.setState({ askForAPIKey: true }); }

  onSetAPIKey(apiKey) { this.setState({ apiKey, askForAPIKey: false }); }

  onClosePopup(event) {
    if (this.popupRef && this.popupRef.contains(event.target)) {
      return;
    }

    this.setState({ askForAPIKey: false });
  }

  onSetPopupRef(ref) { this.popupRef = ref; }

	render() {
    const {
      language,
      code,
      diffs,
      errorExplanation,
      waitingForCodeFix,
      waitingForCodeLint,
      askForAPIKey,
      apiKey
    } = this.state;

    return (
      <Fragment>
        {askForAPIKey ? (
          <div className="popupLayer" onClick={this.onClosePopup}>
            <Popup
              onSubmit={this.onSetAPIKey}
              setRef={this.onSetPopupRef}
            />
          </div>
        ) : null}
        <div className="app">
          <Header onClick={this.onOpenPopup} />
          <div className="body">
            <div className="lhs">
              <CodeEditor
                code={code}
                diffs={diffs}
                onResolveDiff={this.onResolveDiff}
                onChange={this.onCodeChange}
                language={language}
                onSelectLanguage={this.onSelectLanguage}
                isLoading={waitingForCodeLint}
                onLint={this.onLint}
              />
              <ErrorMessage onDebug={this.onDebug} isLoading={waitingForCodeFix} />
            </div>
            <ErrorExplanation errorExplanation={errorExplanation} />
          </div>
        </div>
      </Fragment>
    );
	}
}
