import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Header from "../containers/Header";
import CodeEditor from "../containers/CodeEditor";
import ErrorMessage from "../containers/ErrorMessage";
import ChatBot from "../containers/ChatBot";
import UnresolvedDiffModal from "../containers/UnresolvedDiffModal";

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
    this.onDebug = this.onDebug.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
    this.onSuggestChanges = this.onSuggestChanges.bind(this);

    this.state = {
      language: DEFAULT_LANGUAGE,
      code: DEMO_CODE,
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
    if (documentIds.length != 0) {
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
    }).filter(otherDiff => otherDiff.id != diffId);
    let updatedCode = code.filter((_, index) => !linesToDelete.includes(index));

    this.setState({ code: updatedCode, diffs: updatedDiffs });
  }

  onDebug(errorMessage) {
    Mixpanel.track("click_debug", { isErrorMessageEmpty: errorMessage == "" });

    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently, user } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length !== 0) { // Can't debug code if diffs aren't resolved
      Mixpanel.track("has_unresolved_diffs", { clickSource: "debug" });
      this.setState({ waitingForDiffResolution: true, waitingForDebug: false })
      return;
    }

    if (!isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname
        }
      });
      return;
    }

    this.setState({ waitingForDebug: true });

    let requestBody;
    let endpoint;
    if (errorMessage != "") {
      endpoint = "https://rubrick-api-production.up.railway.app/api/debug";
      requestBody = JSON.stringify({
        user_id: user.sub,
        email: user.email,
        code: code.join("\n"),
        error: errorMessage,
        is_demo_code: code == DEMO_CODE
      });
    } else {
      endpoint = "https://rubrick-api-production.up.railway.app/api/lint";
      requestBody = JSON.stringify({
        user_id: user.sub,
        email: user.email,
        code: code.join("\n"),
        is_demo_code: code == DEMO_CODE
      });
    }

    getAccessTokenSilently()
      .then(token => {
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: requestBody
        })
          .then(this.handleRateLimitErrors)
          .then(data => {
            Mixpanel.track("received_debug_response")

            const { new_code } = data;
            let newCode = new_code.split("\n");
            let { mergedCode, diffs } = diffCode(code, newCode);
            const suggestedMessage = {
              preview: "What's wrong with my code?",
              code: code.join("\n")
            };

            this.setState({
              waitingForDebug: false,
              suggestedMessages: [suggestedMessage],
              code: mergedCode,
              diffs,
              errorMessage
            });
          })
          .catch(error => {
            Mixpanel.track("click_debug_failure");
            this.setState({ waitingForDebug: false });

            console.log(error);
          });

        // TODO: Run these API calls in parallel and block state update until both complete
      });
  };

  onSuggestChanges(message) {
    Mixpanel.track("click_suggest_changes");

    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently, user } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length != 0) {
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
            is_demo_code: code == DEMO_CODE
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
      waitingForDebug,
      waitingForDiffResolution,
      waitingForSuggestedChanges,
      suggestedMessages,
      errorMessage,
      shouldUpdateContext,
      isRateLimited
    } = this.state;

    return (
      <>
        {waitingForDiffResolution ? (
          <UnresolvedDiffModal
            setModalRef={ref => this.modalRef = ref}
            onCloseModal={event => {
              if (this.modalRef && this.modalRef.contains(event.target)) {
                return;
              }

              this.setState({ waitingForDiffResolution: false });
            }}
          />
        ) : null}

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
                isRateLimited={isRateLimited}
              />
              <ErrorMessage
                onDebug={this.onDebug}
                isLoading={waitingForDebug}
                onChange={this.onUpdateErrorMessage}
              />
            </div>
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
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(withAuth0(App));