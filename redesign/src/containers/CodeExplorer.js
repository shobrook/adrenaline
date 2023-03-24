import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";
import Grid from "@mui/material/Grid";

import PaywallMessage from "./PaywallMessage";
import CodeSnippetInput from "./CodeSnippetInput";
import GithubInput from "./GithubInput";
import FileStructure from "./FileStructure";
import Mixpanel from "../library/mixpanel";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import { getFileContent } from "../library/utilities";

import "../styles/CodeExplorer.css";
import AddCodeButton from "../components/AddCodeButton";

class Codebase {
    constructor(title, isCodeSnippet) {
        this.title = title;
        this.isCodeSnippet = isCodeSnippet;
        // this.language;
        // this.lastUpdated;
    }
}

const DEFAULT_STATE = {
    renderCodeSnippet: false,
    renderRepository: false,
    renderSelectRepository: false,
    renderSelectCodeSnippet: false,
    renderFileTree: false,
    renderPaywall: false,
    renderIndexingProgress: false,
    progressMessage: "",
    codebases: [], // List of codebase objects
    repositoryOptions: [],
    currentCodeContext: {
        files: [],
        currentFile: "",
        code: "",
        language: "python"
    }
};

class CodeExplorer extends Component {
    constructor(props) {
        super(props);

        this.fetchRepositoryOptions = this.fetchRepositoryOptions.bind(this);

        this.onToggleFileTree = this.onToggleFileTree.bind(this);
        this.onSetCodebase = this.onSetCodebase.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onSetProgressMessage = this.onSetProgressMessage.bind(this);
        this.onSetCodeSnippet = this.onSetCodeSnippet.bind(this);
        this.onReturnToManager = this.onReturnToManager.bind(this);

        this.renderHeader = this.renderHeader.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderCodebaseManager = this.renderCodebaseManager.bind(this);
        this.renderIndexingProgress = this.renderIndexingProgress.bind(this);
        this.renderCodeExplorer = this.renderCodeExplorer.bind(this);
        this.renderFileTree = this.renderFileTree.bind(this);

        this.state = DEFAULT_STATE;
    }

    /* Utilities */

    fetchRepositoryOptions() {
        const { isGithubAuthenticated } = this.props;
        const { user, isAuthenticated, getAccessTokenSilently } = this.props.auth0;

        if (!isAuthenticated) {
            return;
        }

        if (!isGithubAuthenticated) {
            return;
        }

        console.log("yooooo")

        getAccessTokenSilently()
            .then(token => {
                fetch("http://localhost:5000/api/github_repositories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: user.sub })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { is_github_authenticated, repos } = data;

                        if (!is_github_authenticated) {
                            this.setState({ isGithubAuthenticated: false });
                        }

                        console.log(repos)
                        this.setState({ isGithubAuthenticated: true, repositoryOptions: repos });
                    })
            });
    }

    /* Event Handlers */

    onSetCodeSnippet(codebaseId, code, language, isPaywalled) {
        const { onSetCodebaseId } = this.props;
        const { currentCodeContext } = this.state;

        onSetCodebaseId(codebaseId);
        this.setState({
            renderPaywall: isPaywalled,
            renderIndexingProgress: false,
            renderCodeSnippet: true,
            currentCodeContext: {
                ...currentCodeContext,
                code,
                language
            }
        });
    }

    onSetProgressMessage(progressMessage) {
        this.setState({
            renderIndexingProgress: true,
            renderSelectCodeSnippet: false,
            renderSelectRepository: false,
            progressMessage
        });
    }

    onToggleFileTree() {
        console.log("toggled")
        const { renderFileTree } = this.state;
        this.setState({ renderFileTree: !renderFileTree });
    }

    async onSetCodebase(codebaseId, files, isPaywalled) {
        const { onSetCodebaseId } = this.props;
        onSetCodebaseId(codebaseId);

        if (isPaywalled) {
            this.setState({
                renderRepository: true,
                renderPaywall: true,
                renderIndexingProgress: false
            });
            return
        }

        const currentFile = Object.keys(files)[0]; // Default to first file in tree
        const fileUrl = files[currentFile].url;
        const fileContent = await getFileContent(fileUrl);
        const fileLanguage = files[currentFile].language;

        this.setState({
            currentCodeContext: {
                files,
                currentFile,
                code: fileContent,
                language: fileLanguage
            },
            renderRepository: true,
            renderIndexingProgress: false
        });
    }

    async onSelectFile(filePath) {
        const { files } = this.state.currentCodeContext;
        const fileUrl = files[filePath].url;
        const fileLanguage = files[filePath].language;
        const fileContent = await getFileContent(fileUrl);

        this.setState({
            currentCodeContext: {
                files: files,
                currentFile: filePath,
                code: fileContent,
                language: fileLanguage
            }
        });
    }

    onReturnToManager() {
        this.setState({
            renderCodeSnippet: false,
            renderRepository: false,
            renderSelectRepository: false,
            renderSelectCodeSnippet: false,
            renderFileTree: false,
            renderPaywall: false,
            renderIndexingProgress: false
        });
    }

    /* Renderers */

    renderFileTree() {
        const { renderFileTree } = this.state;
        const { files } = this.state.currentCodeContext;
        const filePaths = Object.keys(files);

        return (
            <FileStructure
                onSelectFile={this.onSelectFile}
                filePaths={filePaths}
                isOpen={renderFileTree}
            />
        );
    }

    renderSelectCodeSnippet() {
        const { renderSelectCodeSnippet } = this.state;

        if (!renderSelectCodeSnippet) {
            return null;
        }

        return (
            <CodeSnippetInput
                onSetProgressMessage={this.onSetProgressMessage}
                onSetCodeSnippet={this.onSetCodeSnippet}
            />
        );
    }

    renderCodeExplorer() {
        const {
            renderCodeSnippet,
            renderRepository
        } = this.state;
        const { code, language } = this.state.currentCodeContext;

        if (!renderRepository && !renderCodeSnippet) {
            return null;
        }

        return (
            <div id="codePreview">
                <SyntaxHighlighter className="codeBlock" language={language} style={dracula}>
                    {code}
                </SyntaxHighlighter>
            </div>
        );
    }

    renderIndexingProgress() {
        const { renderIndexingProgress, progressMessage } = this.state;

        if (!renderIndexingProgress) {
            return null;
        }

        return (
            <div id="indexingProgress">
                <Spinner />
                <span>{progressMessage}</span>
            </div>
        );
    }

    renderSelectRepository() {
        const { onGithubAuthentication, isGithubAuthenticated } = this.props;
        const { renderSelectRepository, repositoryOptions } = this.state;

        if (!renderSelectRepository) {
            return null;
        }

        if (isGithubAuthenticated) {
            return (
                <div id="selectRepository">
                    {repositoryOptions.map(repo => {
                        const { id, name, is_private, language } = repo;

                        return (<span>{name}</span>); // TODO
                    })}
                    <GithubInput
                        onSetProgressMessage={this.onSetProgressMessage}
                        onSetCodebase={this.onSetCodebase}
                    />
                </div>
            );
        }

        return (
            <div id="selectRepository">
                <Button isPrimary onClick={onGithubAuthentication}>Import repository</Button>
                <GithubInput
                    onSetProgressMessage={this.onSetProgressMessage}
                    onSetCodebase={this.onSetCodebase}
                />
            </div>
        );
    }

    renderCodebaseManager() {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress,
            codebases
        } = this.state;
        const renderCodebaseManager = !renderCodeSnippet && !renderRepository && !renderSelectRepository && !renderSelectCodeSnippet && !renderIndexingProgress;

        if (!renderCodebaseManager) {
            return null;
        }

        return (
            <div id="initCodebaseManager">
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={() => this.setState({ renderSelectRepository: true })}>Add repository</AddCodeButton>
                    </Grid>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={() => this.setState({ renderSelectCodeSnippet: true })}>Add code snippet</AddCodeButton>
                    </Grid>
                    {
                        codebases.map(codebase => {
                            const { title, isCodeSnippet } = codebase;

                            return (
                                <Grid item xs={6}>
                                    <div className="codebaseThumbnail">
                                        {
                                            isCodeSnippet ? (<img src="./code_snippet_icon.png" />)
                                                : (<img src="./repository_icon.png" />)
                                        }
                                        <span>{title}</span>
                                    </div>
                                    <div className="spacer" />
                                </Grid>
                            );
                        })
                    }
                </Grid>
            </div >
        );

        // TODO: On componentDidMount, hit endpoint to get list of codebases that
        // user has uploaded
    }

    renderPaywall() {
        const { renderPaywall } = this.state;
        const { onUpgradePlan } = this.props;

        if (renderPaywall) {
            return <PaywallMessage className="codeExplorerPaywall" onUpgradePlan={onUpgradePlan} />;
        }

        return null;
    }

    renderHeader() {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectRepository,
            renderSelectCodeSnippet
        } = this.state;
        const { currentFile } = this.state.currentCodeContext;

        if (renderSelectRepository) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        <img src="./repository_icon.png" />
                        <span>Add GitHub repository</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            );
        }

        if (renderRepository) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        <img src="./file_tree_icon.png" onClick={this.onToggleFileTree} />
                        <span>{currentFile}</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            );
        }

        if (renderSelectCodeSnippet) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        <img src="./code_snippet_icon.png" />
                        <span>Add a code snippet</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            )
        }

        if (renderCodeSnippet) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        <img src="./code_snippet_icon.png" />
                        <span>Code snippet</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            );
        }

        return (
            <div id="managerHeader">
                <div id="headerLabel">
                    <img src="./manager_icon.png" />
                    <span>Manage codebases</span>
                </div>
            </div>
        )
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.fetchRepositoryOptions();
    }

    componentDidUpdate(previousProps, previousState) {
        const { isGithubAuthenticated: prevAuthStatus } = previousProps;
        const { isGithubAuthenticated: currAuthStatus } = this.props;

        if (!(!prevAuthStatus && currAuthStatus)) { // Component didn't update due to user authentication
            return;
        }

        console.log("ypepp")

        this.fetchRepositoryOptions();
    }

    render() {
        const { renderRepository, renderFileTree, renderPaywall } = this.state;

        if (renderRepository) {
            let codeContentClassName = renderFileTree ? "truncatedCodeContent" : "";
            codeContentClassName += renderPaywall ? " paywalledCodeContent" : "";

            return (
                <div id="codeExplorer" className="repositoryView">
                    {this.renderPaywall()}
                    {this.renderFileTree()}
                    <motion.div
                        id="codeContent"
                        className={codeContentClassName}
                        initial="closed"
                        animate={renderFileTree ? "open" : "closed"}
                        variants={{
                            open: { width: "70%" },
                            closed: { width: "100%" }
                        }}
                    >
                        {this.renderHeader()}
                        {this.renderCodeExplorer()}
                    </motion.div>
                </div>
            )
        }

        return (
            <div id="codeExplorer">
                {this.renderPaywall()}
                {this.renderHeader()}
                {this.renderCodebaseManager()}
                {this.renderSelectRepository()}
                {this.renderSelectCodeSnippet()}
                {this.renderIndexingProgress()}
                {this.renderCodeExplorer()}
            </div>
        );
    }
}

export default withAuth0(CodeExplorer);