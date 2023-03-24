import { Component } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";

import PaywallMessage from "./PaywallMessage";
import CodeSnippetInput from "./CodeSnippetInput";
import GithubInput from "./GithubInput";
import FileStructure from "./FileStructure";
import Mixpanel from "../library/mixpanel";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import { getFileContent } from "../library/utilities";

import "../styles/CodeExplorer.css";

const DEFAULT_STATE = {
    progressMessage: "",
    githubUrl: "",
    files: [],
    currentFile: "",
    code: "",
    isCodeSnippet: false,
    language: "python",
    displayFileTree: false,
    displayPaywall: false
};

export default class CodeExplorer extends Component {
    constructor(props) {
        super(props);

        this.onToggleFileTree = this.onToggleFileTree.bind(this);
        this.onSetCodebase = this.onSetCodebase.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onChangeContext = this.onChangeContext.bind(this);
        this.onSetProgressMessage = this.onSetProgressMessage.bind(this);
        this.onSetCodeSnippet = this.onSetCodeSnippet.bind(this);

        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderExplorer = this.renderExplorer.bind(this);
        this.renderPrompt = this.renderPrompt.bind(this);
        this.renderFileTree = this.renderFileTree.bind(this);

        this.state = DEFAULT_STATE;
    }

    /* Event Handlers */

    onSetCodeSnippet(codebaseId, code, language, isPaywalled) {
        const { onSetCodebaseId } = this.props;

        onSetCodebaseId(codebaseId);
        this.setState({ isCodeSnippet: true, code, language, displayPaywall: isPaywalled });
    }

    onSetProgressMessage(progressMessage) {
        this.setState({ progressMessage });
    }

    onToggleFileTree() {
        const { displayFileTree } = this.state;
        this.setState({ displayFileTree: !displayFileTree });
    }

    async onSetCodebase(codebaseId, githubUrl, files) {
        const { onSetCodebaseId } = this.props;
        const currentFile = Object.keys(files)[0]; // Default to first file in tree
        const fileUrl = files[currentFile].url;
        const fileContent = await getFileContent(fileUrl);
        const fileLanguage = files[currentFile].language;

        onSetCodebaseId(codebaseId);
        this.setState({
            githubUrl,
            files,
            currentFile,
            code: fileContent,
            language: fileLanguage
        });
    }

    async onSelectFile(filePath) {
        const { files } = this.state;
        const fileUrl = files[filePath].url;
        const fileLanguage = files[filePath].language;
        const fileContent = await getFileContent(fileUrl);

        this.setState({
            code: fileContent,
            currentFile: filePath,
            language: fileLanguage
        });
    }

    onChangeContext() {
        const { onSetCodebaseId } = this.props;

        onSetCodebaseId("");
        this.setState(DEFAULT_STATE);
    }

    /* Renderers */

    renderPaywall() {
        const { displayPaywall } = this.state;
        const { onUpgradePlan } = this.props;

        if (displayPaywall) {
            return <PaywallMessage className="codeExplorerPaywall" onUpgradePlan={onUpgradePlan} />;
        }

        return null;
    }

    renderPrompt() {
        const { codebaseId } = this.props;
        const { progressMessage } = this.state;

        if (codebaseId != "" || progressMessage != "") {
            return null;
        }

        return (
            <div id="codeContextPrompt">
                <span>Add your code</span>
                <GithubInput
                    onSetProgressMessage={this.onSetProgressMessage}
                    onSetCodebase={this.onSetCodebase}
                />
                <CodeSnippetInput
                    onSetProgressMessage={this.onSetProgressMessage}
                    onSetCodeSnippet={this.onSetCodeSnippet}
                />
            </div>
        );
    }

    renderProgressMessage() {
        const { progressMessage } = this.state;

        if (progressMessage == "") {
            return null;
        }

        return (
            <div id="progressMessage">
                <Spinner />
                <span>{progressMessage}</span>
            </div>
        );
    }

    renderFileTree() {
        const { displayFileTree, files } = this.state;
        const filePaths = Object.keys(files);

        return (
            <FileStructure
                onSelectFile={this.onSelectFile}
                filePaths={filePaths}
                isOpen={displayFileTree}
            />
        );
    }

    renderExplorer() {
        const { codebaseId } = this.props;
        const { progressMessage } = this.state;
        const {
            githubUrl,
            currentFile,
            code,
            displayFileTree,
            displayPaywall,
            isCodeSnippet,
            language
        } = this.state;

        // TODO: Handle case where language isn't supported by Prism

        if (codebaseId == "" || progressMessage != "") {
            return null;
        }

        let codeContentClassName = displayFileTree ? "truncatedCodeContent" : "";
        codeContentClassName += displayPaywall ? " paywalledCodeContent" : "";

        return (
            <>
                <motion.div
                    id="codeContent"
                    className={codeContentClassName}
                    initial="closed"
                    animate={displayFileTree ? "open" : "closed"}
                    variants={{
                        open: { width: "70%" },
                        closed: { width: "100%" }
                    }}
                >
                    {isCodeSnippet ? (
                        <div id="codeHeader">
                            <img src="./folder_icon.png" />
                            <span>TODO: Summarize code snippet</span>
                        </div>
                    ) : (
                        <div id="codeHeader">
                            <img src="./folder_icon.png" onClick={this.onToggleFileTree} />
                            <span>{currentFile}</span>
                        </div>
                    )}
                    <div id="codePreview">
                        <SyntaxHighlighter className="codeBlock" language={language} style={dracula}>
                            {code}
                        </SyntaxHighlighter>
                    </div>
                    <div id="codeContextOptions">
                        {isCodeSnippet ? (
                            null
                        ) : (
                            <div id="repoLink">
                                <img src="./github_icon.png" />
                                <a href={githubUrl} target="_blank">{codebaseId}</a>
                            </div>
                        )}
                        <Button isPrimary onClick={this.onChangeContext}>Change context</Button>
                    </div>
                </motion.div>
            </>
        );
    }

    /* Lifecycle Methods */

    render() {
        return (
            <div id="codeExplorer">
                {this.renderPaywall()}
                {this.renderPrompt()}
                {this.renderProgressMessage()}
                {this.renderFileTree()}
                {this.renderExplorer()}
            </div>
        );
    }
}