import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion } from "framer-motion";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import { HiTrash, HiCode } from "react-icons/hi";
import { AiFillGithub, AiFillGitlab } from "react-icons/ai";
import Box from '@mui/material/Box';

import PaywallMessage from "./PaywallMessage";
import CodeSnippetInput from "./CodeSnippetInput";
import RepositoryInput from "./RepositoryInput";
import AuthenticatedRepositoryInput from "./AuthenticatedRepositoryInput";
import FileStructure from "./FileStructure";
import FileSummary from "./FileSummary";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import AddCodeButton from "../components/AddCodeButton";
import ProgressBar from "../components/ProgressBar";
import { CodeSnippet, Repository } from "../library/data";

import { formControlClasses } from "@mui/material";
import Mixpanel from "../library/mixpanel";
import toast from "react-hot-toast";

const DEFAULT_PROGRESS_STATE = {
    progressStepHistory: [],
    progressStep: "",
    progressTarget: null,
    progressMessage: "",
    progress: 0
}
const DEFAULT_STATE = {
    renderCodeSnippet: false,
    renderRepository: false,
    renderSelectGitHubRepository: false,
    renderSelectGitLabRepository: false,
    renderSelectPrivateRepository: false,
    renderSelectCodeSnippet: false,
    renderFileTree: true,
    renderPaywall: false,
    renderIndexingProgress: false,
    ...DEFAULT_PROGRESS_STATE,
    paywallMessage: "You've reached your repository limit! Upgrade your plan to increase it.",
    codebases: [], // List of codebase objects
    currentCodeContext: {
        files: [],
        currentFile: "",
        code: "",
        fileSummary: "",
        language: "python",
        isPrivate: false,
        isGitLab: false
    }
};

class CodeExplorer extends Component {
    constructor(props) {
        super(props);

        this.onToggleFileTree = this.onToggleFileTree.bind(this);
        this.onSetCodebase = this.onSetCodebase.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onSetProgressMessage = this.onSetProgressMessage.bind(this);
        this.onSetCodeSnippet = this.onSetCodeSnippet.bind(this);
        this.onReturnToManager = this.onReturnToManager.bind(this);
        this.onToggleSelectPrivateRepository = this.onToggleSelectPrivateRepository.bind(this);

        this.renderHeader = this.renderHeader.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderCodebaseManager = this.renderCodebaseManager.bind(this);
        this.renderIndexingProgress = this.renderIndexingProgress.bind(this);
        this.renderCodeExplorer = this.renderCodeExplorer.bind(this);
        this.renderFileTree = this.renderFileTree.bind(this);

        this.shouldRenderCodebaseManager = this.shouldRenderCodebaseManager.bind(this);
        this.getFileContent = this.getFileContent.bind(this);
        this.fetchCodebases = this.fetchCodebases.bind(this);
        this.deleteCodebase = this.deleteCodebase.bind(this);

        this.state = DEFAULT_STATE;
    }

    /* Utilities */

    fetchCodebases() {
        const { getAccessTokenSilently, isAuthenticated, user } = this.props.auth0;

        if (!isAuthenticated) {
            return;
        }

        getAccessTokenSilently()
            .then(async token => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URI}api/user_codebases`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: user.sub })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { codebases } = data;

                        this.setState({
                            codebases: codebases.map(codebase => {
                                const {
                                    name,
                                    is_code_snippet,
                                    codebase_id,
                                    files,
                                    code,
                                    language,
                                    is_private,
                                    is_gitlab
                                } = codebase;

                                if (is_code_snippet) {
                                    return new CodeSnippet(codebase_id, name, code, language);
                                }

                                return new Repository(codebase_id, name, files, is_private, is_gitlab);
                            })
                        });
                    });
            });
    }

    async getFileContent(filePath, fileUrl, codebaseId, isGitLab, isPrivateRepo) {
        const { user, getAccessTokenSilently } = this.props.auth0;

        return await getAccessTokenSilently()
            .then(async token => {
                return await fetch(`${process.env.NEXT_PUBLIC_API_URI}api/${isGitLab ? "gitlab" : "github"}_file_content`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        codebase_id: codebaseId,
                        file_url: fileUrl,
                        file_path: filePath,
                        is_private: isPrivateRepo
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { file_content, file_summary } = data;
                        return {
                            fileContent: file_content,
                            fileSummary: file_summary
                        };
                    })
                    .catch(error => {
                        console.log(error);
                    })
            })
    }

    shouldRenderCodebaseManager() {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectGitHubRepository,
            renderSelectGitLabRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress
        } = this.state;
        return !renderCodeSnippet && !renderRepository && !renderSelectGitHubRepository && !renderSelectGitLabRepository && !renderSelectCodeSnippet && !renderIndexingProgress;
    }

    deleteCodebase(codebase) {
        const { codebaseId } = codebase;
        const { getAccessTokenSilently, user } = this.props.auth0;

        const toastIdGenerate = toast.loading("Deleting codebase...")
        getAccessTokenSilently()
            .then(token => {
                fetch(`${process.env.NEXT_PUBLIC_API_URI}api/delete_codebase`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        codebase_id: codebaseId
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { success } = data;

                        if (success) {
                            console.log("Fetching codebases")
                            this.fetchCodebases();
                        } else {
                            toast.error("Failed to delete codebase!");
                        }
                        toast.success("Codebase deleted!");
                    })
                    .catch(error => {
                        console.log(error);
                        toast.error("Failed to delete codebase!");
                    })
                    .finally(() => {
                        toast.dismiss(toastIdGenerate);
                    })
            });
    }

    /* Event Handlers */

    onToggleSelectPrivateRepository() {
        const { renderSelectPrivateRepository } = this.state;
        this.setState({ renderSelectPrivateRepository: !renderSelectPrivateRepository });
    }

    onSetCodeSnippet(codeSnippet, isPaywalled) {
        const { onSetCodebaseId } = this.props;
        const { currentCodeContext } = this.state;
        const { codebaseId, name, code, language } = codeSnippet;

        onSetCodebaseId(codebaseId);
        this.setState({
            renderPaywall: isPaywalled,
            renderIndexingProgress: false,
            renderCodeSnippet: true,
            currentCodeContext: {
                ...currentCodeContext,
                code,
                language,
                currentFile: name
            }
        });
    }

    onSetProgressMessage(progressStep, progressMessage, progressTarget, haltProgress = false) {
        this.setState(prevState => {
            const { 
                progressStep: prevProgressStep, 
                progress, 
                progressStepHistory
            } = prevState;
            const updatedProgress = progressStep == prevProgressStep ? progress + 1 : 0;

            let updatedProgressStepHistory = progressStepHistory.slice();
            if (prevProgressStep && prevProgressStep != progressStep) {
                updatedProgressStepHistory.push(prevProgressStep);
            }

            let progressState;
            if (haltProgress) {
                progressState = {
                    renderIndexingProgress: false,
                    ...DEFAULT_PROGRESS_STATE
                }
            } else {
                progressState = {
                    renderIndexingProgress: true,
                    progressMessage,
                    progressTarget,
                    progressStep,
                    progress: updatedProgress,
                    progressStepHistory: updatedProgressStepHistory
                }
            }

            return {
                renderSelectCodeSnippet: false,
                renderSelectGitHubRepository: false,
                renderSelectGitLabRepository: false,
                ...progressState
            }
        });
    }

    onToggleFileTree() {
        const { renderFileTree } = this.state;
        this.setState({ renderFileTree: !renderFileTree });
    }

    async onSetCodebase(repository, isPaywalled, paywallMessage = "") {
        const { onSetCodebaseId } = this.props;
        const { codebaseId, files, isPrivate, isGitLab } = repository;

        onSetCodebaseId(codebaseId);

        if (isPaywalled) {
            this.setState({
                renderRepository: true,
                renderPaywall: true,
                renderIndexingProgress: false,
                paywallMessage: paywallMessage != "" ? paywallMessage : this.state.paywallMessage
            });
            return
        }

        let currentFile = Object.keys(files).find(filePath => files[filePath].language != "text" && !filePath.startsWith("."));
        currentFile = currentFile ? currentFile : Object.keys(files)[-1];
        const fileUrl = files[currentFile].url;
        const { fileContent, fileSummary } = await this.getFileContent(currentFile, fileUrl, codebaseId, isGitLab, isPrivate);
        const fileLanguage = files[currentFile].language;

        this.setState({
            currentCodeContext: {
                files,
                code: fileContent,
                language: fileLanguage,
                fileSummary,
                currentFile,
                isPrivate,
                isGitLab
            },
            renderRepository: true,
            renderIndexingProgress: false
        });
    }

    async onSelectFile(filePath) {
        const { setFileContext, codebaseId } = this.props;
        const { files, isPrivate, isGitLab } = this.state.currentCodeContext;
        const { language: fileLanguage, url: fileUrl } = files[filePath];
        const { fileContent, fileSummary } = await this.getFileContent(filePath, fileUrl, codebaseId, isGitLab, isPrivate);

        this.setState({
            currentCodeContext: {
                files: files,
                code: fileContent,
                fileSummary,
                language: fileLanguage,
                currentFile: filePath,
                isPrivate,
                isGitLab
            }
        });
        setFileContext("");
    }

    onReturnToManager() {
        const { setFileContext } = this.props;

        this.setState({
            renderCodeSnippet: false,
            renderRepository: false,
            renderSelectGitHubRepository: false,
            renderSelectGitLabRepository: false,
            renderSelectCodeSnippet: false,
            renderFileTree: false,
            renderPaywall: false,
            renderIndexingProgress: false
        });
        setFileContext("");
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
        const { code, language, fileSummary } = this.state.currentCodeContext;

        if (!renderRepository && !renderCodeSnippet) {
            return null;
        }

        return (
            <div id="codePreview">
                <FileSummary>{fileSummary}</FileSummary>
                <SyntaxHighlighter
                    className="codeBlock"
                    language={language}
                    style={dracula}
                    showLineNumbers={true}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        );
    }

    renderIndexingProgress() {
        const { 
            renderIndexingProgress, 
            progress, 
            progressTarget, 
            progressMessage,
            progressStep,
            progressStepHistory
        } = this.state;

        if (!renderIndexingProgress) {
            return null;
        }

        const prevProgressBars = progressStepHistory.map((step, index) => ( <ProgressBar key={index} step={step} value={100} /> ));
        const progressValue = progressTarget ? (progress / progressTarget) * 100 : 0;

        console.log(progressStep)
        console.log(progressTarget)
        console.log(progressValue)
        console.log()

        return (
            <div id="indexingProgress">
                {prevProgressBars}
                <ProgressBar key={prevProgressBars.length} step={progressStep} message={progressMessage} value={progressValue} />
            </div>
        );
    }

    renderSelectRepository() {
        const {
            renderSelectGitHubRepository,
            renderSelectGitLabRepository,
            renderSelectPrivateRepository
        } = this.state;

        if (!renderSelectGitHubRepository && !renderSelectGitLabRepository) {
            return null;
        }

        return (
            <div id="selectRepository">
                <div id="selectRepositoryHeading">
                    <span id="selectHeading">Add a {renderSelectGitHubRepository ? "GitHub" : "GitLab"} repository</span>
                    <span id="selectSubheading">Paste a link to a public repository or import your own by authenticating with {renderSelectGitHubRepository ? "GitHub" : "GitLab"}.</span>
                </div>

                <div id="repoSwitch">
                    <Switch
                        size="small"
                        checked={renderSelectPrivateRepository}
                        onChange={this.onToggleSelectPrivateRepository}
                        color="secondary"
                    />
                    <span id={renderSelectPrivateRepository ? "activeSwitch" : "passiveSwitch"}>Your repos</span>
                </div>

                {renderSelectPrivateRepository ? (
                    <AuthenticatedRepositoryInput
                        onSetProgressMessage={this.onSetProgressMessage}
                        onSetCodebase={this.onSetCodebase}
                        isGitLab={renderSelectGitLabRepository}
                    />
                ) : (
                    <>
                        <RepositoryInput
                            onSetProgressMessage={this.onSetProgressMessage}
                            onSetCodebase={this.onSetCodebase}
                            isGitLab={renderSelectGitLabRepository}
                        />
                    </>
                )}
            </div>
        );
    }

    renderCodebaseManager() {
        const { codebases } = this.state;
        const renderCodebaseManager = this.shouldRenderCodebaseManager();

        if (!renderCodebaseManager) {
            return null;
        }

        const handleAddGitHubRepository = () => {
            this.setState({ renderSelectGitHubRepository: true })
            Mixpanel.track("Add GitHub repository")
        }

        const handleAddGitLabRepository = () => {
            this.setState({ renderSelectGitLabRepository: true });
            Mixpanel.track("Add GitLab repository");
        }

        const handleAddCodeSnippet = () => {
            this.setState({ renderSelectCodeSnippet: true })
            Mixpanel.track("Add a code snippet")
        }

        return (
            <div id="initCodebaseManager">
                <Grid className="grid" container spacing={2}>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={handleAddGitHubRepository}>Add GitHub repository</AddCodeButton>
                    </Grid>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={handleAddGitLabRepository}>Add GitLab repository</AddCodeButton>
                    </Grid>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={handleAddCodeSnippet}>Add code
                            snippet</AddCodeButton>
                    </Grid>
                    {
                        codebases.map(codebase => {
                            const { name, isCodeSnippet, isGitLab } = codebase;

                            if (isCodeSnippet) {
                                return (
                                    <Grid item xs={6}>
                                        <div className="codebaseThumbnail">
                                            <div className="codebaseName" onClick={() => this.onSetCodeSnippet(codebase, false)}>
                                                <HiCode file="white" size={22} />
                                                <span>{name}</span>
                                            </div>
                                            <HiTrash fill="white" size={22} onClick={() => this.deleteCodebase(codebase)} />
                                        </div>
                                        <div className="spacer" />
                                    </Grid>
                                )
                            }

                            return (
                                <Grid item xs={6}>
                                    <div className="codebaseThumbnail">
                                        <div className="codebaseName" onClick={async () => await this.onSetCodebase(codebase, false)}>
                                            {
                                                isGitLab ? (<AiFillGitlab fill="white" size={22} />) :
                                                    (<AiFillGithub fill="white" size={22} />)
                                            }
                                            <span>{name}</span>
                                        </div>
                                        <HiTrash fill="white" size={22} onClick={() => this.deleteCodebase(codebase)} />
                                    </div>
                                    <div className="spacer" />
                                </Grid>
                            );
                        })
                    }
                </Grid>
            </div>
        );
    }

    renderPaywall() {
        const { renderPaywall, paywallMessage } = this.state;
        const { onUpgradePlan } = this.props;

        if (renderPaywall) {
            return (
                <PaywallMessage
                    className="codeExplorerPaywall"
                    onUpgradePlan={onUpgradePlan}
                    message={paywallMessage}
                />
            );
        }

        return null;
    }

    renderHeader() {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectGitHubRepository,
            renderSelectGitLabRepository,
            renderSelectCodeSnippet
        } = this.state;
        const { currentFile } = this.state.currentCodeContext;

        if (renderSelectGitHubRepository || renderSelectGitLabRepository) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        {/* <img src="./repository_icon.png" /> */}
                        <span>Add {renderSelectGitHubRepository ? "GitHub" : "GitLab"} repository</span>
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
                        {/* <img src="./code_snippet_icon.png" /> */}
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
                        <img id="codeSnippetIcon" src="./code_snippet_icon.png" />
                        <span>Code snippet</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            );
        }

        return (
            <div id="managerHeader">
                <div id="headerLabel">
                    {/* <img src="./manager_icon.png" /> */}
                    <span>Manage codebases</span>
                </div>
            </div>
        )
    }

    /* Lifecycle Methods */

    componentDidMount() {
        const { fileContext } = this.props;
        const { renderCodeSnippet, renderRepository } = this.state;

        this.fetchCodebases();

        if (fileContext != "" && (renderRepository || renderCodeSnippet)) {
            this.onSelectFile(fileContext);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { fileContext } = this.props;
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectGitHubRepository,
            renderSelectGitLabRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress
        } = prevState;
        const prevShouldRenderCodebaseManager = !renderCodeSnippet && !renderRepository && !renderSelectGitHubRepository && !renderSelectGitLabRepository && !renderSelectCodeSnippet && !renderIndexingProgress;
        const shouldRenderCodebaseManager = this.shouldRenderCodebaseManager();

        if (prevShouldRenderCodebaseManager != shouldRenderCodebaseManager && shouldRenderCodebaseManager) {
            this.fetchCodebases();
        }

        if (fileContext != "" && (this.state.renderRepository || this.state.renderCodeSnippet) && this.state.currentCodeContext.currentFile != fileContext) {
            this.onSelectFile(fileContext);
        }
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