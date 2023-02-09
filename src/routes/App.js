import React, { Component, Fragment } from 'react';
import { Configuration, OpenAIApi } from "openai";

import {
  OLD_CODE_LABEL,
  FIXED_CODE_LABEL,
  range,
  diffGPTOutput,
  withRouter
} from "../utilities";

import AuthenticationComponent from "../components/AuthenticationComponent";
import RegistrationForm from '../containers/RegistrationForm';
import Header from "../containers/Header";
import CodeEditor from "../containers/CodeEditor";
import ErrorMessage from "../containers/ErrorMessage";
import ErrorExplanation from "../containers/ErrorExplanation";

import '../styles/App.css';

const FIXED_CODE = [
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
  "noise = 0.0001 * np.random.rand(n, 2)",
  "df2 += noise",
  "df = pd.concat([df1, df2], axis=1)",
  "",
  "df.plot()",
  "",
  "grangercausalitytests(df, maxlag=20)"
]
const DEFAULT_CODE = [
  "#################",
  "### DEMO CODE ###",
  "#################",
  "",
  "# Replace this with your own code to get started.",
  "",
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

class App extends AuthenticationComponent {
	constructor(props) {
		super(props);

    this.onCodeChange = this.onCodeChange.bind(this);
    this.onResolveDiff = this.onResolveDiff.bind(this);
    this.onDebug = this.onDebug.bind(this);
    this.onLint = this.onLint.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);

		this.state = {
      language: {label: "Python", value: "python"},
      code: DEFAULT_CODE,
      errorMessage: "",
      diffs: [],
      errorExplanation: "",
      waitingForCodeFix: false,
      waitingForCodeLint: false,
    };
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
    window.gtag("event", "click_use_me");

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
    // TODO: Make this request in the backend

    window.gtag("event", "click_debug");

    // const { code, isLoggedIn } = this.state;
    let isLoggedIn = localStorage.getItem("isLoggedIn");
    isLoggedIn = isLoggedIn ? JSON.parse(isLoggedIn) : false;

    if (!isLoggedIn) {
      this.setState({ isRegistering: true });
      return;
    } else if (errorMessage === "") {
      return;
    } else {
      this.setState({ waitingForCodeFix: true });
    }

    // const apiConfig = new Configuration({ apiKey });
    // const api = new OpenAIApi(apiConfig);

    // let instruction = `Fix this error: ${errorMessage}`;
    // api
  	// 	.createEdit({
  	//     ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
  	//   })
  	//   .then(data => {
    //     let inputCode = code.join("\n").trim().split("\n");
  	// 		let gptCode = data.data.choices[0].text.trim().replace("    ", "\t").split("\n");

    //     let { mergedCode, diffs } = diffGPTOutput(inputCode, gptCode);

    //     // let prompt = `Explain the following error message:\n\`\`\`\n${errorMessage}\n\`\`\``;
    //     let prompt = `Explain what this error message means and how to fix it:\n\`\`\`\n${errorMessage}\n\`\`\``;
    //     api
    //       .createCompletion({ ...COMPLETION_PROMPT_PARAMS, prompt })
    //       .then(data => {
    //         let errorExplanation = data.data.choices[0].text;
    //         this.setState({
    //           waitingForCodeFix: false,
    //           code: mergedCode,
    //           diffs,
    //           errorMessage,
    //           errorExplanation
    //         });
    //       }).
    //       catch(error => console.log(error.response));
  	// 	})
  	// 	.catch(error => console.log(error.response));
  };

  onLint() {
    window.gtag("event", "click_lint");

    // const { code, language, isLoggedIn } = this.state;
    let isLoggedIn = localStorage.getItem("isLoggedIn");
    isLoggedIn = isLoggedIn ? JSON.parse(isLoggedIn) : false;

    if (!isLoggedIn) {
      this.setState({ isRegistering: true });
      return;
    } else {
      this.setState({ waitingForCodeLint: true });
    }

    // const apiConfig = new Configuration({ apiKey });
    // const api = new OpenAIApi(apiConfig);

    // let instruction = `Identify and fix all bugs in this ${language.label} code.`;

    // api
    //   .createEdit({
    //     ...EDIT_PROMPT_PARAMS, input: code.join("\n"), instruction
    //   })
    //   .then(data => {
    //     let inputCode = code.join("\n").trim().split("\n");
    //     let gptCode = data.data.choices[0].text.trim().replace("    ", "\t").split("\n");
    //     let { mergedCode, diffs } = diffGPTOutput(inputCode, gptCode);

    //     this.setState({
    //       waitingForCodeLint: false,
    //       code: mergedCode,
    //       diffs
    //     });
    //   })
    //   .catch(error => {
    //     this.setState({ waitingForCodeLint: false });
    //   });
  }

  onSelectLanguage(language) {
    window.gtag("event", "select_language", { language });

    this.setState({ language });
  }

	render() {
    const { location } = this.props.router;
    const {
      language,
      code,
      diffs,
      errorExplanation,
      waitingForCodeFix,
      waitingForCodeLint,
      isRegistering
    } = this.state;

    let isLoggedIn = localStorage.getItem("isLoggedIn");
    isLoggedIn = isLoggedIn ? JSON.parse(isLoggedIn) : false;

    console.log(isLoggedIn);
    
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
    });

    return (
      <>
        {isRegistering ? (
            <RegistrationForm 
              setRef={this.onSetRegistrationRef} 
              onLogIn={this.onLogIn}
              onSignUp={this.onSignUp}
              onCloseForm={this.onCloseForm}
            />
          ) : null}

        <div className="app">
          <Header 
            onClick={isLoggedIn ? this.onLogOut : this.onOpenRegistrationForm} 
            isLoggedIn={isLoggedIn} 
          />

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
      </>
    );
	}
}

export default withRouter(App);