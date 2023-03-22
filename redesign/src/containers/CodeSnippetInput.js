import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import Editor from "react-simple-code-editor";
// import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-python";

import Button from "../components/Button";

import "prismjs/themes/prism.css"; // TODO: Change style
import "../styles/CodeSnippetInput.css";

// TODO: Add dropdown for selecting a language
// TODO: Send the language to the websocket

class CodeSnippetInput extends Component {
    constructor(props) {
        super(props);

        this.onChangeCode = this.onChangeCode.bind(this);
        this.onSubmitCode = this.onSubmitCode.bind(this);
        this.onFocus = this.onFocus.bind(this);

        this.state = { code: "" };
    }

    /* Event Handlers */

    onFocus(event) {
        event.preventDefault();
        this.ref._input.focus();
    }

    onChangeCode(code) {
        this.setState({ code });
    }

    onSubmitCode() {
        const { onSetProgressMessage } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;
        const { code } = this.state;

        if (code == "") {
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

        getAccessTokenSilently()
            .then(token => {
                const request = {
                    user_id: user.sub,
                    token: token,
                    code
                };
                this.websocket.send(JSON.stringify(request));

                onSetProgressMessage("Analyzing code");
            });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { code } = this.state;
        const { onSetCodeSnippet, onSetProgressMessage } = this.props;

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://localhost:5001/index_code_snippet`);
        } else {
            this.websocket = new WebSocket(`ws://localhost:5001/index_code_snippet`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
            const { codebase_id, is_final } = JSON.parse(event.data);

            if (is_final) {
                onSetProgressMessage("");
                onSetCodeSnippet(codebase_id, code);
            }
        }
        this.websocket.onerror = event => { };
    }

    render() {
        const { code } = this.state;

        return (
            <div id="inputField" className="codeSnippetInput">
                <div id="editorWrapper" onClick={this.onFocus}>
                    <Editor
                        ref={ref => this.ref = ref}
                        value={code}
                        onValueChange={this.onChangeCode}
                        highlight={code => highlight(code, languages.python)}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14
                        }}
                    />
                </div>
                <Button
                    id="addCodeSnippetButton"
                    isPrimary
                    onClick={this.onSubmitCode}
                >
                    Add
                </Button>
            </div>
        );
    }
}

export default withAuth0(CodeSnippetInput);