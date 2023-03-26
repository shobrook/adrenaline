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
import "../styles/CodeSnippetInput.css";

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

        this.onSelectLanguage = this.onSelectLanguage.bind(this);
        this.onChangeCode = this.onChangeCode.bind(this);
        this.onSubmitCode = this.onSubmitCode.bind(this);
        this.onFocus = this.onFocus.bind(this);

        this.state = { code: LANGUAGES[0].codeExample, language: LANGUAGES[0] };
    }

    /* Event Handlers */

    onSelectLanguage(language) {
        this.setState({ language, code: language.codeExample });
    }

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
                const request = {
                    user_id: user.sub,
                    token: token,
                    language: language.value,
                    code
                };
                this.websocket.send(JSON.stringify(request));

                console.log("aosjdfiosadf")
                console.log(code)

                onSetProgressMessage("Analyzing code");
            });
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { onSetCodeSnippet, onSetProgressMessage } = this.props;

        if (window.location.protocol === "https:") {
            this.websocket = new WebSocket(`wss://localhost:5001/index_code_snippet`);
        } else {
            this.websocket = new WebSocket(`ws://localhost:5001/index_code_snippet`);
        }

        this.websocket.onopen = event => { };
        this.websocket.onmessage = async event => {
            const { code, language } = this.state;
            const { codebase_id, name, is_paywalled, error_message } = JSON.parse(event.data);
            const codeSnippet = new CodeSnippet(codebase_id, name, code, language.value);

            onSetProgressMessage("");
            onSetCodeSnippet(codeSnippet, is_paywalled);
        }
        this.websocket.onerror = event => {
            console.log(event); // TODO: Show error message
        };
    }

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