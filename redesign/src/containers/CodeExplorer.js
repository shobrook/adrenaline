import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
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

        this.onConnectGithub = this.onConnectGithub.bind(this);
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

    /* Event Handlers */

    onConnectGithub() {
        const clientId = "fcaf8f61d70e5de447c9";
        // const redirectUri = "https://useadrenaline.com/app";
        const redirectUri = "http://localhost:3000/app";
        // const login = ""; // TODO: Populate this if user is already authenticated with Github
        const scope = "repo";

        let authUrl = "https://github.com/login/oauth/authorize?"
        authUrl += `client_id=${clientId}`;
        authUrl += `&redirect_uri=${redirectUri}`;
        // authUrl += `&login=${login}`;
        authUrl += `&scope=${scope}`;

        const win = window.open(authUrl, "_blank"); // TODO: Open in same tab
        if (win != null) {
            win.focus();
        }
    }

    onSetCodeSnippet(codebaseId, code, language, isPaywalled) {
        const { onSetCodebaseId } = this.props;
        const { currentCodeContext } = this.state;

        onSetCodebaseId(codebaseId);
        this.setState({
            renderCodeSnippet: true,
            renderPaywall: isPaywalled,
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

    // renderExplorer() {
    //     const { codebaseId } = this.props;
    //     const { progressMessage } = this.state;
    //     const {
    //         githubUrl,
    //         currentFile,
    //         code,
    //         displayFileTree,
    //         displayPaywall,
    //         isCodeSnippet,
    //         language
    //     } = this.state;

    //     // TODO: Handle case where language isn't supported by Prism

    //     if (codebaseId == "" || progressMessage != "") {
    //         return null;
    //     }

    //     let codeContentClassName = displayFileTree ? "truncatedCodeContent" : "";
    //     codeContentClassName += displayPaywall ? " paywalledCodeContent" : "";

    //     return (
    //         <>
    //             <motion.div
    //                 id="codeContent"
    //                 className={codeContentClassName}
    //                 initial="closed"
    //                 animate={displayFileTree ? "open" : "closed"}
    //                 variants={{
    //                     open: { width: "70%" },
    //                     closed: { width: "100%" }
    //                 }}
    //             >
    //                 {isCodeSnippet ? (
    //                     <div id="codeHeader">
    //                         <img src="./folder_icon.png" />
    //                         <span>TODO: Summarize code snippet</span>
    //                     </div>
    //                 ) : (
    //                     <div id="codeHeader">
    //                         <img src="./folder_icon.png" onClick={this.onToggleFileTree} />
    //                         <span>{currentFile}</span>
    //                     </div>
    //                 )}
    //                 <div id="codePreview">
    //                     <SyntaxHighlighter className="codeBlock" language={language} style={dracula}>
    //                         {code}
    //                     </SyntaxHighlighter>
    //                 </div>
    //                 <div id="codeContextOptions">
    //                     {isCodeSnippet ? (
    //                         null
    //                     ) : (
    //                         <div id="repoLink">
    //                             <img src="./github_icon.png" />
    //                             <a href={githubUrl} target="_blank">{codebaseId}</a>
    //                         </div>
    //                     )}
    //                     <Button isPrimary onClick={this.onChangeContext}>Change context</Button>
    //                 </div>
    //             </motion.div>
    //         </>
    //     );
    // }

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
        const { renderSelectRepository } = this.state;

        if (!renderSelectRepository) {
            return null;
        }

        return (
            <div id="selectRepository">
                <Button isPrimary onClick={this.onConnectGithub}>Import repository</Button>
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
                <AddCodeButton onClick={() => this.setState({ renderSelectRepository: true })}>Add repository</AddCodeButton>
                <div className="spacer" />
                <AddCodeButton onClick={() => this.setState({ renderSelectCodeSnippet: true })}>Add code snippet</AddCodeButton>
                {
                    codebases.map(codebase => {
                        const { title, isCodeSnippet } = codebase;

                        return (
                            <>
                                <div className="codebaseThumbnail">
                                    {
                                        isCodeSnippet ? (<img src="./code_snippet_icon.png" />)
                                            : (<img src="./repository_icon.png" />)
                                    }
                                    <span>{title}</span>
                                </div>
                                <div className="spacer" />
                            </>
                        );
                    })
                }
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