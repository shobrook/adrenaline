import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Header from "../containers/Header";
import CodeEditor from "../containers/CodeEditor";
import ChatBot from "../containers/ChatBot";

import { OLD_CODE_LABEL, NEW_CODE_LABEL, DEMO_CODE, DEFAULT_LANGUAGE } from "../library/constants";
import { withRouter, updateDiffIndexing, diffCode } from "../library/utilities";
import Mixpanel from "../library/mixpanel";

import "../styles/App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.setCachedDocumentIds = this.setCachedDocumentIds.bind(this);
    this.onUpdateErrorMessage = this.onUpdateErrorMessage.bind(this);
    this.handleRateLimitErrors = this.handleRateLimitErrors.bind(this);
    this.onCodeChange = this.onCodeChange.bind(this);
    this.onResolveDiff = this.onResolveDiff.bind(this);
    this.onResolveAllDiffs = this.onResolveAllDiffs.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
    this.onSuggestChanges = this.onSuggestChanges.bind(this);
    this.onError = this.onError.bind(this);

    this.state = {
      language: DEFAULT_LANGUAGE,
      // code: DEMO_CODE,
      code: ["# Paste your code here"],
      errorMessage: "",
      diffs: [],
      waitingForDebug: false,
      waitingForSuggestedChanges: false,
      suggestedMessages: [],
      waitingForDiffResolution: false,
      shouldUpdateContext: true,
      isRateLimited: false
    };
  }

  /* Utilities */

  setCachedDocumentIds(documentIds) {
    if (documentIds.length !== 0) {
      localStorage.setItem("cachedDocumentIds", JSON.stringify(documentIds))
    }

    this.setState({ shouldUpdateContext: false });
  }

  handleRateLimitErrors(res) {
    if (!res.ok) {
      if (res.status === 429) { // Rate limit
        Mixpanel.track("debug_rate_limit_reached");
        this.setState({ isRateLimited: true });
      }

      throw new Error(`HTTP status ${res.status}`);
    }

    return res.json()
  }

  /* Event Handlers */

  onError(errorMessage) {
    this.setState({ suggestedMessages: [{ preview: "What's causing my code to fail?", prompt: `What's causing this error:\n${errorMessage}` }] });
  }

  onCodeChange(editor, data, newCode) {
    const { code, diffs } = this.state;
    newCode = newCode.split("\n")

    // Lines were either inserted or deleted, requiring an update in diff indexing
    if (code.length !== newCode.length) {
      updateDiffIndexing(diffs, data);
    }

    // TODO: Find a more intelligent way to determine whether we should update context (e.g. threshold for % of code changed?)
    this.setState({ code: newCode, diffs, shouldUpdateContext: true });
  }

  onResolveDiff(diff, linesToDelete, indicatorLineNum) {
    Mixpanel.track("resolve_diff"); // TODO: Indicate if its old or new code being used

    const { code, diffs } = this.state;
    const { id: diffId, oldCodeWidget, newCodeWidget } = diff;

    if (indicatorLineNum !== undefined) {
      let line = code[indicatorLineNum];

      if (line === OLD_CODE_LABEL || line === NEW_CODE_LABEL) {
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
    }).filter(otherDiff => otherDiff.id !== diffId);
    let updatedCode = code.filter((_, index) => !linesToDelete.includes(index));

    this.setState({ code: updatedCode, diffs: updatedDiffs });
  }

  onResolveAllDiffs(accept = true) {
    const { diffs, code } = this.state;

    let linesToDelete = [];
    diffs.forEach(diff => {
      const { oldLines, newLines, mergeLine } = diff;

      let indicatorLineNum;
      if (accept) {
        linesToDelete.push(...oldLines);
        indicatorLineNum = newLines.at(-1);
      } else {
        linesToDelete.push(...newLines);
        indicatorLineNum = oldLines.at(0);
      }

      linesToDelete.push(mergeLine);

      if (indicatorLineNum !== undefined) {
        let line = code[indicatorLineNum];

        if (line === OLD_CODE_LABEL || line === NEW_CODE_LABEL) {
          linesToDelete.push(indicatorLineNum);
        }
      }
    });

    let updatedCode = code.filter((_, index) => !linesToDelete.includes(index));
    this.setState({ code: updatedCode, diffs: [] });
  }

  onSuggestChanges(message) {
    Mixpanel.track("click_suggest_changes");

    const {
      isAuthenticated,
      loginWithRedirect,
      getAccessTokenSilently,
      user
    } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length !== 0) {
      Mixpanel.track("has_unresolved_diffs", { clickSource: "suggest_changes" });
      this.setState({ waitingForDiffResolution: true })
      return;
    }

    if (!isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname
        }
      });
      return;
    } else {
      this.setState({ waitingForSuggestedChanges: true });
    }

    getAccessTokenSilently()
      .then(token => {
        fetch("https://rubrick-api-production.up.railway.app/api/suggest_changes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user.sub,
            email: user.email,
            code: code.join("\n"),
            message,
            is_demo_code: code === DEMO_CODE
          })
        })
          .then(this.handleRateLimitErrors)
          .then(data => {
            Mixpanel.track("received_suggest_changes_response");

            const { new_code } = data;
            let newCode = new_code.split("\n");
            let { mergedCode, diffs } = diffCode(code, newCode);

            this.setState({
              waitingForSuggestedChanges: false,
              code: mergedCode,
              diffs
            });
          })
          .catch(error => {
            Mixpanel.track("click_suggest_changes_failure");
            this.setState({ waitingForSuggestedChanges: false });

            console.log(error);
          });
      });
  }

  onSelectLanguage(language) {
    Mixpanel.track("select_language", { language: language.label });
    this.setState({ language });
    localStorage.setItem("language", JSON.stringify(language));
    console.log("language", JSON.stringify(language))
  }

  onUpdateErrorMessage(errorMessage) {
    this.setState({ errorMessage, shouldUpdateContext: true });
  }

  /* Lifecycle Methods */

  componentDidMount() {
    const { user, isAuthenticated } = this.props.auth0;

    if (isAuthenticated) {
      Mixpanel.identify(user.sub);
      Mixpanel.people.set({ email: user.email });
    }

    Mixpanel.track("load_playground");
  }

  render() {
    const {
      language,
      code,
      diffs,
      waitingForDiffResolution,
      waitingForSuggestedChanges,
      suggestedMessages,
      errorMessage,
      shouldUpdateContext,
      isRateLimited
    } = this.state;

    return (
      <>
        <div className="app">
          <Header />

          <div className="body">
            <ChatBot
              suggestedMessages={suggestedMessages}
              clearSuggestedMessages={() => this.setState({ suggestedMessages: [] })}
              errorMessage={errorMessage}
              code={code.join("\n")}
              shouldUpdateContext={shouldUpdateContext}
              setCachedDocumentIds={this.setCachedDocumentIds}
              onSuggestChanges={this.onSuggestChanges}
              waitingForSuggestedChanges={waitingForSuggestedChanges}
            />
            <CodeEditor
              code={code}
              diffs={diffs}
              onResolveDiff={this.onResolveDiff}
              onResolveAllDiffs={this.onResolveAllDiffs}
              onChange={this.onCodeChange}
              language={language}
              onSelectLanguage={this.onSelectLanguage}
              isRateLimited={isRateLimited}
              waitingForDiffResolution={waitingForDiffResolution}
              onCloseDiffAlert={() => this.setState({ waitingForDiffResolution: false })}
              onError={this.onError}
            />
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(withAuth0(App));