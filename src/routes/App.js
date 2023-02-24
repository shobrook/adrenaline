import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import RateLimitModal from "../containers/RateLimitModal";
import Header from "../containers/Header";
import CodeEditor from "../containers/CodeEditor";
import ErrorMessage from "../containers/ErrorMessage";
import ChatBot from "../containers/ChatBot";
import UnresolvedDiffModal from "../containers/UnresolvedDiffModal";

import { OLD_CODE_LABEL, NEW_CODE_LABEL, DEMO_CODE, DEFAULT_LANGUAGE } from "../library/constants";
import { withRouter, updateDiffIndexing, diffCode } from "../library/utilities";

import "../styles/App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.setCachedDocumentIds = this.setCachedDocumentIds.bind(this);
    this.onUpdateErrorMessage = this.onUpdateErrorMessage.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.onCodeChange = this.onCodeChange.bind(this);
    this.onResolveDiff = this.onResolveDiff.bind(this);
    this.onDebug = this.onDebug.bind(this);
    this.onLint = this.onLint.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
    this.onSuggestChanges = this.onSuggestChanges.bind(this);

    this.state = {
      language: DEFAULT_LANGUAGE,
      code: DEMO_CODE,
      errorMessage: "",
      diffs: [],
      waitingForDebug: false,
      waitingForLint: false,
      waitingForSuggestedChanges: false,
      isRateLimited: false,
      suggestedMessages: [],
      waitingForDiffResolution: false,
      shouldUpdateContext: true
    };
  }

  /* Event Handlers */

  setCachedDocumentIds(documentIds) {
    if (documentIds.length != 0) {
      localStorage.setItem("cachedDocumentIds", JSON.stringify(documentIds))
    }

    this.setState({ shouldUpdateContext: false });
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
    window.gtag("event", "click_use_me");

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

  processResponse(res) {
    if (!res.ok) {
      if (res.status === 429) { // Rate limit
        window.gtag("event", "rate_limit_hit");
        this.setState({ isRateLimited: true });
      }

      throw new Error(`HTTP status ${res.status}`);
    }

    return res.json()
  }

  onDebug(errorMessage) {
    window.gtag("event", "click_debug");

    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently, user } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length !== 0) { // Can't debug code if diffs aren't resolved
      this.setState({ waitingForDiffResolution: true, waitingForDebug: false })
      return;
    }

    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    } else if (errorMessage === "") {
      return;
    } else {
      this.setState({ waitingForDebug: true });
    }

    getAccessTokenSilently()
      .then(token => {
        fetch("https://staging-rubrick-api-production.up.railway.app/api/debug", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user.sub,
            email: user.email,
            code: code.join("\n"),
            error: errorMessage
          })
        })
          .then(res => res.json())
          .then(data => {
            const { new_code } = data;
            let newCode = new_code.split("\n");
            let { mergedCode, diffs } = diffCode(code, newCode);

            fetch("https://staging-rubrick-api-production.up.railway.app/api/generate_suggested_questions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                user_id: user.sub,
                email: user.email,
                code: code.join("\n"),
                error: errorMessage
              })
            })
              .then(res => res.json())
              .then(data => {
                window.gtag("event", "click_debug_success");

                const { suggested_questions } = data;
                const suggestedMessages = suggested_questions.map(question => ({ preview: question, prompt: question }));

                this.setState({
                  waitingForDebug: false,
                  suggestedMessages: suggestedMessages.slice(0, 3),
                  code: mergedCode,
                  diffs,
                  errorMessage
                });
              })
          })
          .catch(error => {
            window.gtag("event", "click_debug_failure");
            this.setState({ waitingForDebug: false });

            console.log(error);
          });

        // TODO: Run these API calls in parallel and block state update until both complete
      });
  };

  onLint() {
    window.gtag("event", "click_lint");

    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently, user } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length != 0) {
      this.setState({ waitingForDiffResolution: true, waitingForDebug: false })
      return;
    }

    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    } else {
      this.setState({ waitingForLint: true });
    }

    getAccessTokenSilently()
      .then(token => {
        fetch("https://staging-rubrick-api-production.up.railway.app/api/lint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user.sub,
            email: user.email,
            code: code.join("\n")
          })
        })
          .then(res => res.json())
          .then(data => {
            window.gtag("event", "click_lint_success");

            const { new_code } = data;
            let newCode = new_code.split("\n");
            let { mergedCode, diffs } = diffCode(code, newCode);

            this.setState({
              waitingForLint: false,
              code: mergedCode,
              diffs
            });
          })
          .catch(error => {
            window.gtag("event", "click_lint_failure");
            this.setState({ waitingForLint: false });

            console.log(error);
          });
      });
  }

  onSuggestChanges(message) {
    window.gtag("event", "click_suggest_changes");

    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently, user } = this.props.auth0;
    const { code, diffs } = this.state;

    if (diffs.length != 0) {
      this.setState({ waitingForDiffResolution: true })
      return;
    }

    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    } else {
      this.setState({ waitingForSuggestedChanges: true });
    }

    getAccessTokenSilently()
      .then(token => {
        fetch("http://staging-rubrick-api-production.up.railway.app/api/suggest_changes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user.sub,
            email: user.email,
            code: code.join("\n"),
            message
          })
        })
          .then(res => res.json())
          .then(data => {
            window.gtag("event", "click_suggest_changes_success");

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
            window.gtag("event", "click_suggest_changes_failure");
            this.setState({ waitingForSuggestedChanges: false });

            console.log(error);
          });
      });
  }

  onSelectLanguage(language) {
    window.gtag("event", "select_language", { language });
    this.setState({ language });
  }

  onUpdateErrorMessage(errorMessage) {
    this.setState({ errorMessage, shouldUpdateContext: true });
  }

  render() {
    const { location } = this.props.router;
    const {
      language,
      code,
      diffs,
      waitingForDebug,
      waitingForLint,
      waitingForDiffResolution,
      waitingForSuggestedChanges,
      isRateLimited,
      suggestedMessages,
      errorMessage,
      shouldUpdateContext
    } = this.state;

    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
    });

    return (
      <>
        {waitingForDiffResolution ? (
          <UnresolvedDiffModal
            setModalRef={this.onSetModalRef}
            onCloseModal={event => { this.onCloseModal(event); this.setState({ waitingForDiffResolution: false }) }}
          />
        ) : null}

        {isRateLimited ? (
          <RateLimitModal
            setModalRef={this.onSetModalRef}
            onCloseModal={event => { this.onCloseModal(event); this.setState({ isRateLimited: false }) }}
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
                isLoading={waitingForLint}
                onLint={this.onLint}
              />
              <ErrorMessage
                onDebug={this.onDebug}
                isLoading={waitingForDebug}
                onChange={this.onUpdateErrorMessage}
              />
            </div>
            <ChatBot
              suggestedMessages={suggestedMessages}
              resetSuggestedMessages={() => this.setState({ suggestedMessages: [] })}
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