import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import Select from "react-select";
import Editor from "react-simple-code-editor";
// import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { highlight, languages } from "prismjs/components/prism-core";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-php";
import "prismjs/components/prism-r";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-perl";
import "prismjs/components/prism-java";
import "prismjs/components/prism-haskell";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-c";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-scala";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-swift";

import Button from "../components/Button";
import { CodeSnippet } from "../library/data";

import "prismjs/themes/prism.css"; // TODO: Change style
import toast from "react-hot-toast";

const LANGUAGES = [
    { label: "Python", value: "python", prismMode: languages.python, codeExample: "# Paste your code here" },
    { label: "JavaScript", value: "javascript", prismMode: languages.javascript, codeExample: "// Paste your code here" },
    { label: "Node.js", value: "javascript", prismMode: languages.javascript, codeExample: "// Paste your code here" },
    { label: "Java", value: "clike", prismMode: languages.java, codeExample: "// Paste your code here" },
    { label: "Ruby", value: "ruby", prismMode: languages.ruby, codeExample: "# Paste your code here" },
    { label: "PHP", value: "php", prismMode: languages.php, codeExample: "// Paste your code here" },
    { label: "C++", value: "clike", prismMode: languages.c, codeExample: "// Paste your code here" },
    { label: "C", value: "clike", prismMode: languages.c, codeExample: "// Paste your code here" },
    { label: "R", value: "r", prismMode: languages.r, codeExample: "# Paste your code here" },
    { label: "Bash", value: "shell", prismMode: languages.bash, codeExample: "# Paste your code here" },
    { label: "C#", value: "clike", prismMode: languages.csharp, codeExample: "// Paste your code here" },
    { label: "Go", value: "go", prismMode: languages.go, codeExample: "// Paste your code here" },
    { label: "Perl", value: "perl", prismMode: languages.perl, codeExample: "# Paste your code here" },
    { label: "Scala", value: "clike", prismMode: languages.scala, codeExample: "// Paste your code here" },
    { label: "Haskell", value: "haskell", prismMode: languages.haskell, codeExample: "-- Paste your code here" },
    { label: "Kotlin", value: "clike", prismMode: languages.kotlin, codeExample: "// Paste your code here" },
    { label: "Rust", value: "rust", prismMode: languages.rust, codeExample: "// Paste your code here" },
    { label: "SQL", value: "sql", prismMode: languages.sql, codeExample: "-- Paste your code here" },
    { label: "Swift", value: "swift", prismMode: languages.swift, codeExample: "// Paste your code here" },
];

class CodeSnippetInput extends Component {
    constructor(props) {
        super(props);

        this.openWebsocketConnection = this.openWebsocketConnection.bind(this);

        this.onSelectLanguage = this.onSelectLanguage.bind(this);
        this.onChangeCode = this.onChangeCode.bind(this);
        this.onSubmitCode = this.onSubmitCode.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBeforeUnload = this.onBeforeUnload.bind(this);

        this.websocket = null;

        this.state = { code: LANGUAGES[0].codeExample, language: LANGUAGES[0] };
    }

    /* Utilities */

    openWebsocketConnection(callback) {
        const { onSetProgressMessage, onSetCodeSnippet } = this.props;

        if (this.websocket != null || this.websocket != undefined) {
            callback(this.websocket);
            return;
        }

        let ws = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}index_code_snippet`);
        ws.onopen = event => {
            this.websocket = ws;
            window.addEventListener("beforeunload", this.onBeforeUnload);

            callback(ws);
        };
        ws.onmessage = async event => {
            if (event.data == "ping") {
                ws.send("pong");
                return;
            }

            const { code, language } = this.state;
            const {
                name,
                step,
                codebase_id,
                is_paywalled,
                is_finished,
                progress_target,
                error
            } = JSON.parse(event.data);

            if (error != "") {
                toast.error(error, {
                    style: {
                        borderRadius: "7px",
                        background: "#FB4D3D",
                        color: "#fff",
                    },
                    iconTheme: {
                        primary: '#ffffff7a',
                        secondary: '#fff',
                    }
                });
                onSetProgressMessage(step, "", progress_target, true);
                return;
            }

            if (is_finished) {
                const codeSnippet = new CodeSnippet(codebase_id, name, code, language.value);

                onSetProgressMessage(null, "", progress_target, true);
                onSetCodeSnippet(codeSnippet, is_paywalled);
            } else {
                onSetProgressMessage(step, "", progress_target);
            }
        }
        ws.onerror = event => {
            this.websocket = null;
            onSetProgressMessage("", "", false, null, true);
            window.removeEventListener("beforeunload", this.onBeforeUnload);

            toast.error("We are experiencing unusually high load. Please try again at another time.", {
                style: {
                    borderRadius: "7px",
                    background: "#FB4D3D",
                    color: "#fff",
                },
                iconTheme: {
                    primary: '#ffffff7a',
                    secondary: '#fff',
                }
            });
        }
        ws.onclose = event => {
            this.websocket = null;
            window.removeEventListener("beforeunload", this.onBeforeUnload);
        }
    }

    /* Event Handlers */

    onBeforeUnload(event) {
        // event.preventDefault();
        this.websocket.close();
    }

    onSelectLanguage(language) {
        this.setState(prevState => {
            const { code } = prevState;
            if (code == prevState.language.codeExample) {
                return { language, code: language.codeExample };
            }

            return { language, code };
        });
    }

    onFocus(event) {
        event.preventDefault();
        this.ref._input.focus();
    }

    onChangeCode(code) {
        this.setState({ code });
    }

    // TODO: Move this up a level
    onSubmitCode() {
        const { onSetCodeSnippet, onSetProgressMessage, onRenderIndexingProgress } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;
        const { code, language } = this.state;

        if (code.trim() == "" || code.trim() == language.codeExample) {
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
                this.openWebsocketConnection(ws => {
                    const request = {
                        user_id: user.sub,
                        token: token,
                        language: language.value,
                        code
                    };
                    ws.send(JSON.stringify(request));

                    onRenderIndexingProgress();
                });
            });
    }

    /* Lifecycle Methods */

    render() {
        const { code, language } = this.state;

        return (
            <div id="inputField" className="codeSnippetInput">
                <div id="codeSnippetHeader">
                    <Select
                        classNamePrefix="languageDropdown"
                        isClearable={false}
                        options={LANGUAGES}
                        onChange={this.onSelectLanguage}
                        defaultValue={language}
                        styles={{
                            control: (provided, state) => ({
                                ...provided,
                                boxShadow: "none",
                                cursor: "pointer",
                                borderRadius: "5px !important"
                            }),
                            menu: (provided, state) => ({
                                ...provided,
                                backgroundColor: "#202030"
                            }),
                            option: (provided, state) => ({
                                ...provided,
                                fontFamily: "Helvetica Neue",
                                fontSize: "16px",
                                fontWeight: "500",
                                backgroundColor: state.isFocused ? "#279AF1" : "transparent",
                                cursor: "pointer"
                            })
                        }}
                    />
                    <Button isPrimary onClick={this.onSubmitCode}>
                        Add
                    </Button>
                </div>
                <div id="editorWrapper" onClick={this.onFocus}>
                    <Editor
                        ref={ref => this.ref = ref}
                        value={code}
                        onValueChange={this.onChangeCode}
                        highlight={code => highlight(code, language.prismMode)}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default withAuth0(CodeSnippetInput);