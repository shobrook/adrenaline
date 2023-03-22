import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Header from "../containers/Header";
import ChatBot from "../containers/ChatBot";
import DocumentFeed from "../containers/DocumentFeed";
import CodeExplorer from "../containers/CodeExplorer";

import { withRouter } from "../library/utilities";
import Mixpanel from "../library/mixpanel";

import "../styles/App.css";

class Message {
  constructor(content, isResponse, isComplete, isPaywalled = false) {
    this.content = content;
    this.isResponse = isResponse;
    this.isComplete = isComplete; // Indicates whether message has finished streaming
    this.isPaywalled = isPaywalled;
  }
}

class Document {
  constructor(content) {
    this.content = content;
  }
}

class CodeChunk {
  constructor(filePath, code, summary) {
    this.filePath = filePath;
    this.code = code;
    this.summary = summary;
  }
}

class StackOverflowPost {
  constructor(title, questionBody, answer, link) {
    this.title = title;
    this.questionBody = questionBody;
    this.answer = answer;
    this.link = link;
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.onSubmitQuery = this.onSubmitQuery.bind(this);
    this.onSetCodebaseId = this.onSetCodebaseId.bind(this);

    this.state = {
      codebaseId: "",
      messages: [new Message("Ask me anything about your code.", true, true)],
      documents: []
    };
  }

  /* Event Handlers */

  onSubmitQuery(message) {
    const { codebaseId, messages } = this.state;
    const {
      isAuthenticated,
      getAccessTokenSilently,
      user
    } = this.props.auth0;

    // TODO: Handle regeneration

    const query = new Message(message, false, true);
    let response = new Message("", true, false);

    if (!isAuthenticated) { // TODO: Display blurred output and prompt user to sign up
      response.content = "You must be signed in to use the chatbot.";
      response.isComplete = true;
    }

    const priorMessages = messages.slice(0, messages.length);
    this.setState({ messages: [...priorMessages, query, response] });

    if (!isAuthenticated) {
      return;
    }

    getAccessTokenSilently()
      .then(token => {
        const request = {
          user_id: user.sub,
          token: token,
          codebase_id: codebaseId,
          query: message
        };
        this.query_ws.send(JSON.stringify(request));
      });
  }

  onSetCodebaseId(codebaseId) {
    this.setState({ codebaseId });
  }

  /* Lifecycle Methods */

  componentDidMount() {
    const { user, isAuthenticated } = this.props.auth0;

    if (isAuthenticated) {
      Mixpanel.identify(user.sub);
      Mixpanel.people.set({ email: user.email });
    }

    Mixpanel.track("load_playground");

    /* Connect to query handler websocket */

    if (window.location.protocol === "https:") {
      this.query_ws = new WebSocket(`wss://localhost:5001/generate_query_response`);
    } else {
      this.query_ws = new WebSocket(`ws://localhost:5001/generate_query_response`);
    }

    this.query_ws.onopen = event => { };
    this.query_ws.onmessage = event => {
      const { type, data } = JSON.parse(event.data);
      const { documents, messages } = this.state;

      if (type == "code_chunk") {
        const { chunk, file_path, summary } = data;
        const document = new Document(`\`\`\`\n${chunk}\n\`\`\``); // TODO: Use CodeChunk

        this.setState({ documents: [...documents, document] });
      } else if (type == "answer") {
        const { message } = data;

        const priorMessages = messages.slice(0, messages.length - 1);
        let response = messages[messages.length - 1];
        if (message !== "STOP") {
          response.content += message;
        } else {
          response.isComplete = true;
        }

        this.setState({ messages: [...priorMessages, response] });
      } else if (type == "so_post") {
        const { title, question_body, answer, link } = data;
        const document = new Document(answer); // TODO: Use StackOverflowPost

        this.setState({ documents: [...documents, document] });
      }
    }
    this.query_ws.onerror = event => { };
  }

  render() {
    const { messages, documents, codebaseId } = this.state;

    console.log("App rendered")

    return (
      <>
        <div className="app">
          <Header />

          <div className="body">
            <ChatBot
              messages={messages}
              onSubmitQuery={this.onSubmitQuery}
            />
            <CodeExplorer
              onSetCodebaseId={this.onSetCodebaseId}
              codebaseId={codebaseId}
            />
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(withAuth0(App));