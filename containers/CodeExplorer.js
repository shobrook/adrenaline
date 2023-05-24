import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion } from "framer-motion";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import { HiTrash, HiCode, HiRefresh } from "react-icons/hi";
import { AiFillGithub, AiFillGitlab } from "react-icons/ai";
import toast from "react-hot-toast";
import { CircularProgress } from "@mui/material";

import AuthenticationWall from "./AuthenticationWall";
import PaywallMessage from "./PaywallMessage";
import CodeSnippetInput from "./CodeSnippetInput";
import RepositoryInput from "./RepositoryInput";
import AuthenticatedRepositoryInput from "./AuthenticatedRepositoryInput";
import FileStructure from "./FileStructure";
import FileSummary from "./FileSummary";
import Button from "../components/Button";
import AddCodeButton from "../components/AddCodeButton";
import ProgressBar from "../components/ProgressBar";
import { CodeSnippet, Repository } from "../library/data";
import Mixpanel from "../library/mixpanel";

const DEFAULT_PROGRESS_STATE = {
    progressStepHistory: [],
    progressStep: "",
    progressTarget: null,
    progressMessage: "",
    progress: 0,
    codebasesInProgress: [],
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
    renderAuthenticationWall: false,
    renderIndexingProgress: false,
    ...DEFAULT_PROGRESS_STATE,
    paywallMessage: "You've reached your repository limit! Upgrade your plan to increase it.",
    codebases: [], // List of codebase objects
    renderLoadingCodebases: false,
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

        this.onIndexRepository = this.onIndexRepository.bind(this);
        this.onBeforeUnload = this.onBeforeUnload.bind(this);
        this.onToggleFileTree = this.onToggleFileTree.bind(this);
        this.onSetCodebase = this.onSetCodebase.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onSetProgressMessage = this.onSetProgressMessage.bind(this);
        this.onSetCodeSnippet = this.onSetCodeSnippet.bind(this);
        this.onReturnToManager = this.onReturnToManager.bind(this);
        this.onToggleSelectPrivateRepository = this.onToggleSelectPrivateRepository.bind(this);

        this.renderHeader = this.renderHeader.bind(this);
        this.renderPaywall = this.renderPaywall.bind(this);
        this.renderAuthenticationWall = this.renderAuthenticationWall.bind(this);
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

    // TODO: Progress state is only tracked for one codebase at a time; need to track for multiple concurrent indexing jobs

    fetchCodebases() {
        const { getAccessTokenSilently, isAuthenticated, user } = this.props.auth0;
        const { codebases } = this.state;

        if (!isAuthenticated) {
            return;
        }

        if (codebases.length > 0) {
            return;
        }

        this.setState({ renderLoadingCodebases: true }, () => {
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
                            let { codebases } = data;
                            codebases = codebases.map(codebase => {
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
                            });

                            this.setState({ renderLoadingCodebases: false, codebases });
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
                        const { file_content, file_summary, is_authenticated } = data;
                        return {
                            fileContent: file_content,
                            fileSummary: file_summary,
                            shouldAuthenticate: !is_authenticated
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
        // TODO: Add loading state (not toast)

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
                            this.setState(prevState => {
                                let { codebases } = prevState;
                                codebases = codebases.filter(codebase => codebase.codebaseId != codebaseId);

                                return { codebases };
                            });
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

    onIndexRepository(repoPath, isGitLab, refreshIndex = false) {
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;

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
                this.websocket = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}index_repository`);

                this.websocket.onopen = event => {
                    const request = {
                        user_id: user.sub,
                        token: token,
                        repo_name: repoPath,
                        refresh_index: refreshIndex,
                        is_gitlab: isGitLab
                    };
                    this.websocket.send(JSON.stringify(request));

                    const codebaseId = `${isGitLab ? "gitlab" : "github"}/${repoPath}`;
                    const name = repoPath.split("/").slice(-1)[0];
                    const repository = new Repository(codebaseId, name, {}, false, isGitLab);
                    
                    // TODO: codebaseInProgress doesn't work for matching with old codebases missing the github/gitlab prefix in their IDs

                    const { codebases, codebasesInProgress } = this.state;
                    this.setState({ 
                        renderIndexingProgress: !refreshIndex,
                        codebasesInProgress: [...codebasesInProgress, repository],
                        codebases: refreshIndex ? codebases : [repository, ...codebases],
                        renderSelectCodeSnippet: false,
                        renderSelectGitHubRepository: false,
                        renderSelectGitLabRepository: false,
                    });

                    Mixpanel.track("Scrape public repository")
                };
                this.websocket.onmessage = async event => {
                    const {
                        content,
                        step,
                        metadata,
                        progress_target,
                        is_finished,
                        is_paywalled,
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
                        this.onSetProgressMessage(step, content, progress_target, true);
                        return;
                    }

                    if (is_finished) {
                        const { codebase_id, name, files, is_gitlab, is_private } = metadata;

                        this.onSetProgressMessage(null, content, progress_target, true);

                        if (is_paywalled) {
                            const repository = new Repository("", "", {});
                            await this.onSetCodebase(repository, is_paywalled, content);

                            // TODO: Remove codebase from state
                            // TODO: Render paywall message

                        } else {
                            const repository = new Repository(codebase_id, name, files, is_private, is_gitlab);
                            await this.onSetCodebase(repository, is_paywalled);
                            
                            let { codebases } = this.state;
                            codebases = codebases.map(codebase => {
                                if (codebase.codebaseId == codebase_id) {
                                    console.log(codebase_id);
                                    codebase.files = files;
                                    codebase.isPrivate = is_private;
                                }

                                return codebase;
                            });
                            this.setState({ codebases });
                        }

                        let { codebasesInProgress } = this.state;
                        codebasesInProgress = codebasesInProgress.filter(codebase => codebase.codebaseId != codebase_id);

                        this.setState({ codebasesInProgress });
                        this.websocket.close();
                    } else {
                        this.onSetProgressMessage(step, content, progress_target);
                    }
                }
                this.websocket.onerror = event => {
                    this.onSetProgressMessage("", "", false, null, true);

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
                };
                // this.websocket.onclose = event => {
                //     console.log("gh input ws close")
                //     console.log(event);
                //     onSetProgressMessage("", true);
                //     toast.error("We are experiencing unusually high load. Please try again at another time.", {
                //         style: {
                //             borderRadius: "7px",
                //             background: "#FB4D3D",
                //             color: "#fff",
                //         },
                //         iconTheme: {
                //             primary: '#ffffff7a',
                //             secondary: '#fff',
                //         }
                //     });
                // };
            });
    }

    onBeforeUnload(event) {
        const { renderIndexingProgress } = this.state;

        if (renderIndexingProgress) {
            // Cancel the event
            event.preventDefault();

            // Chrome requires returnValue to be set
            event.returnValue = "";

            // Show the alert to the user
            const message = "Are you sure you want to leave? Your codebase is still being indexed.";
            event.returnValue = message; // For Chrome
            return message; // For other browsers
        }
    }

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

            if (haltProgress) {
                return DEFAULT_PROGRESS_STATE
            }

            return {
                progressMessage,
                progressTarget,
                progressStep,
                progress: updatedProgress,
                progressStepHistory: updatedProgressStepHistory
            }
        });
    }

    onToggleFileTree() {
        const { renderFileTree } = this.state;
        this.setState({ renderFileTree: !renderFileTree });
    }

    async onSetCodebase(repository, isPaywalled, paywallMessage = "", isRefresh = false) {
        const { onSetCodebaseId } = this.props;
        const { renderIndexingProgress } = this.state;
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
        const { fileContent, fileSummary, shouldAuthenticate } = await this.getFileContent(currentFile, fileUrl, codebaseId, isGitLab, isPrivate);
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
            renderRepository: isRefresh ? true : renderIndexingProgress,
            renderIndexingProgress: false,
            renderAuthenticationWall: shouldAuthenticate
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
        const { setFileContext, onSetCodebaseId } = this.props;

        this.setState({
            renderCodeSnippet: false,
            renderRepository: false,
            renderSelectGitHubRepository: false,
            renderSelectGitLabRepository: false,
            renderSelectCodeSnippet: false,
            renderFileTree: false,
            renderPaywall: false,
            renderIndexingProgress: false
        }, () => {
            setFileContext("");
            onSetCodebaseId("");
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
                onRenderIndexingProgress={() => this.setState({ renderIndexingProgress: true, renderSelectCodeSnippet: false })}
            />
        );
    }

    renderCodeExplorer() {
        const { renderCodeSnippet, renderRepository } = this.state;
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
                        onIndexRepository={this.onIndexRepository}
                        isGitLab={renderSelectGitLabRepository}
                    />
                ) : (
                    <>
                        <RepositoryInput
                            onIndexRepository={this.onIndexRepository}
                            isGitLab={renderSelectGitLabRepository}
                        />
                    </>
                )}
            </div>
        );
    }

    renderCodebaseManager() {
        const { codebases, renderLoadingCodebases } = this.state;
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
                            const { name, isCodeSnippet, isGitLab, codebaseId } = codebase;

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

                            const { codebasesInProgress } = this.state;
                            const shouldRenderLoading = codebasesInProgress.some(c => c.codebaseId == codebaseId);

                            return (
                                <Grid item xs={6}>
                                    <div className="codebaseThumbnail">
                                        <div className="codebaseName" onClick={async () => {
                                            if (shouldRenderLoading) {
                                                this.setState({ renderIndexingProgress: true });
                                                return;
                                            }

                                            await this.onSetCodebase(codebase, false, "", true);
                                        }}>
                                            {
                                                isGitLab ? (<AiFillGitlab fill="white" size={22} />) :
                                                    (<AiFillGithub fill="white" size={22} />)
                                            }
                                            <span>{name}</span>
                                        </div>
                                        <div className="codebaseOptions">
                                            {
                                                shouldRenderLoading ? (<CircularProgress color="secondary" size={20} />) : (
                                                    <HiRefresh 
                                                        fill="white" 
                                                        size={22} 
                                                        onClick={() => {
                                                            let repoName;
                                                            if (codebaseId.startsWith("github/")) {
                                                                repoName = codebaseId.split("github/")[1];
                                                            } else if (codebaseId.startsWith("gitlab/")) { // GitLab repository
                                                                repoName = codebaseId.split("gitlab/")[1];
                                                            } else {
                                                                repoName = codebaseId;
                                                            }

                                                            this.onIndexRepository(repoName, isGitLab, true);
                                                        }}
                                                    />
                                                )
                                            }
                                            <HiTrash fill="white" size={22} onClick={() => this.deleteCodebase(codebase)} />
                                        </div>
                                    </div>
                                    <div className="spacer" />
                                </Grid>
                            );
                        })
                    }

                    {renderLoadingCodebases ? (
                        <Grid item xs={6}>
                            <div className="codebaseThumbnail loadingMessage" />
                            <div className="spacer" />
                        </Grid>
                    ) : null}
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

    renderAuthenticationWall() {
        const { renderAuthenticationWall } = this.state;
        const { isGitLab } = this.state.currentCodeContext;

        if (renderAuthenticationWall) {
            return ( <AuthenticationWall isGitLab={isGitLab} /> );
        }

        return null;
    }

    renderHeader() {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectGitHubRepository,
            renderSelectGitLabRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress
        } = this.state;
        const { currentFile } = this.state.currentCodeContext;

        if (renderSelectGitHubRepository || renderSelectGitLabRepository) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
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

        if (renderIndexingProgress) {
            return (
                <div id="managerHeader">
                    <div id="headerLabel">
                        <span>Indexing code</span>
                    </div>
                    <Button id="returnToManager" onClick={this.onReturnToManager}>Manage Codebases</Button>
                </div>
            );
        }

        return (
            <div id="managerHeader">
                <div id="headerLabel">
                    <span>Manage codebases</span>
                </div>
            </div>
        )
    }

    /* Lifecycle Methods */

    componentDidMount() {
        window.addEventListener("beforeunload", this.onBeforeUnload);

        const { fileContext } = this.props;
        const { renderCodeSnippet, renderRepository } = this.state;

        this.fetchCodebases();

        if (fileContext != "" && (renderRepository || renderCodeSnippet)) {
            this.onSelectFile(fileContext);
        }
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onBeforeUnload);
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
        const { renderRepository, renderFileTree, renderPaywall, renderAuthenticationWall } = this.state;
        const shouldRenderWall = renderPaywall || renderAuthenticationWall;

        if (renderRepository) {
            let codeContentClassName = renderFileTree ? "truncatedCodeContent" : "";
            codeContentClassName += shouldRenderWall ? " paywalledCodeContent" : "";

            return (
                <div className="repositoryView">
                    {this.renderPaywall()}
                    {this.renderAuthenticationWall()}
                    {this.renderFileTree()}
                    <motion.div
                        id="codeContent"
                        className={codeContentClassName}
                        initial="closed"
                        animate={renderFileTree && !shouldRenderWall ? "open" : "closed"}
                        variants={{
                            open: { width: "70%" },
                            closed: { width: "100%" }
                        }}
                    >
                        {this.renderHeader()}
                        {this.renderCodeExplorer()}
                    </motion.div>
                </div>
            );
        }

        return (
            <>
                {this.renderPaywall()}
                {this.renderAuthenticationWall()}
                {this.renderHeader()}
                {this.renderCodebaseManager()}
                {this.renderSelectRepository()}
                {this.renderSelectCodeSnippet()}
                {this.renderIndexingProgress()}
                {this.renderCodeExplorer()}
            </>
        );
    }
}

export default withAuth0(CodeExplorer);