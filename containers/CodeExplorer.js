import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion } from "framer-motion";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import { HiTrash, HiCode } from "react-icons/hi";
import { AiFillGithub } from "react-icons/ai";

import PaywallMessage from "./PaywallMessage";
import CodeSnippetInput from "./CodeSnippetInput";
import GithubInput from "./GithubInput";
import AuthenticatedGithubInput from "./AuthenticatedGithubInput";
import FileStructure from "./FileStructure";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import AddCodeButton from "../components/AddCodeButton";
import { CodeSnippet, Repository } from "../library/data";

import { formControlClasses } from "@mui/material";
import Mixpanel from "../library/mixpanel";
import toast from "react-hot-toast";

const DEFAULT_STATE = {
    renderCodeSnippet: false,
    renderRepository: false,
    renderSelectRepository: false,
    renderSelectPrivateRepository: false,
    renderSelectCodeSnippet: false,
    renderFileTree: false,
    renderPaywall: false,
    renderIndexingProgress: false,
    renderSecondaryIndexingProgress: false,
    progressMessage: "",
    codebases: [], // List of codebase objects
    currentCodeContext: {
        files: [],
        currentFile: "",
        code: "",
        language: "python",
        isPrivate: false
    }
};

class CodeExplorer extends Component {
    constructor(props) {
        super(props);

        this.onToggleFileTree = this.onToggleFileTree.bind(this);
        this.onSetCodebase = this.onSetCodebase.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onSetProgressMessage = this.onSetProgressMessage.bind(this);
        this.onSetSecondaryProgressMessage = this.onSetSecondaryProgressMessage.bind(this);
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
                                    is_private
                                } = codebase;

                                console.log(codebase)

                                if (is_code_snippet) {
                                    return new CodeSnippet(codebase_id, name, code, language);
                                }

                                return new Repository(codebase_id, name, files, is_private);
                            })
                        });
                    });
            });
    }

    async getFileContent(fileUrl, isPrivateRepo) {
        const { user, getAccessTokenSilently } = this.props.auth0;

        return await getAccessTokenSilently()
            .then(async token => {
                return await fetch(`${process.env.NEXT_PUBLIC_API_URI}api/file_content`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        file_url: fileUrl,
                        is_private_repo: isPrivateRepo
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { file_content } = data;
                        return file_content;
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
            renderSelectRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress
        } = this.state;
        return !renderCodeSnippet && !renderRepository && !renderSelectRepository && !renderSelectCodeSnippet && !renderIndexingProgress;
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
                            // TODO: Display toast
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
                currentFile: name,
                isPrivate: formControlClasses
            }
        });
    }

    onSetProgressMessage(progressMessage, haltProgress = false) {
        this.setState({
            renderIndexingProgress: !haltProgress,
            renderSelectCodeSnippet: false,
            renderSelectRepository: false,
            progressMessage
        });
    }

    onSetSecondaryProgressMessage(progressMessage) {
        this.setState({
            renderSecondaryIndexingProgress: true,
            progressMessage
        });
    }

    onToggleFileTree() {
        const { renderFileTree } = this.state;
        this.setState({ renderFileTree: !renderFileTree });
    }

    async onSetCodebase(repository, isPaywalled) {
        const { onSetCodebaseId } = this.props;
        const { codebaseId, files, isPrivate } = repository;

        onSetCodebaseId(codebaseId);

        if (isPaywalled) {
            this.setState({
                renderRepository: true,
                renderPaywall: true,
                renderIndexingProgress: false
            });
            return
        }

        let currentFile = Object.keys(files)[0];
        Object.keys(files).forEach(file => {
            if (file.toLowerCase().endsWith("model.py")) {
                currentFile = file;
                return;
            }
        });

        const fileUrl = files[currentFile].url;
        const fileContent = await this.getFileContent(fileUrl, isPrivate);
        const fileLanguage = files[currentFile].language;

        this.setState({
            currentCodeContext: {
                files,
                currentFile,
                code: fileContent,
                language: fileLanguage,
                isPrivate
            },
            renderRepository: true,
            renderIndexingProgress: false
        });
    }

    async onSelectFile(filePath) {
        const { files, isPrivate } = this.state.currentCodeContext;
        const fileUrl = files[filePath].url;
        const fileLanguage = files[filePath].language;
        const fileContent = await this.getFileContent(fileUrl, isPrivate);

        this.setState({
            currentCodeContext: {
                files: files,
                currentFile: filePath,
                code: fileContent,
                language: fileLanguage,
                isPrivate
            }
        });
    }

    onReturnToManager() {
        const { onSetCodebaseId } = this.props;
        onSetCodebaseId("")

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

    renderSecondaryIndexingProgress() {
        const { renderSecondaryIndexingProgress, progressMessage } = this.state;

        if (!renderSecondaryIndexingProgress) {
            return null;
        }

        return (
            <div id="secondaryIndexingProgress">
                <span>{progressMessage}</span>
            </div>
        );
    }

    renderSelectRepository() {
        const { renderSelectRepository, renderSelectPrivateRepository } = this.state;

        if (!renderSelectRepository) {
            return null;
        }

        return (
            <div id="selectRepository">
                <div id="selectRepositoryHeading">
                    <span id="selectHeading">Add a GitHub repository</span>
                    <span id="selectSubheading">Paste a link to a public repository or import your own by authenticating with GitHub.</span>
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
                    <AuthenticatedGithubInput
                        onSetProgressMessage={this.onSetProgressMessage}
                        onSetSecondaryProgressMessage={this.onSetSecondaryProgressMessage}
                        onSetCodebase={this.onSetCodebase}
                    />
                ) : (
                    <>
                        <GithubInput
                            onSetProgressMessage={this.onSetProgressMessage}
                            onSetSecondaryProgressMessage={this.onSetSecondaryProgressMessage}
                            onSetCodebase={this.onSetCodebase}
                        />
                    </>
                )}
            </div>
        );

        // TODO: Add example GH URLs
    }

    renderCodebaseManager() {
        const { codebases } = this.state;
        const renderCodebaseManager = this.shouldRenderCodebaseManager();

        if (!renderCodebaseManager) {
            return null;
        }

        const handleAddRepository = () => {
            this.setState({ renderSelectRepository: true })
            Mixpanel.track("Add repository")
        }

        const handleAddCodeSnippet = () => {
            this.setState({ renderSelectCodeSnippet: true })
            Mixpanel.track("Add a code snippet")
        }

        return (
            <div id="initCodebaseManager">
                <Grid className="grid" container spacing={2}>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={handleAddRepository}>Add repository</AddCodeButton>
                    </Grid>
                    <Grid item xs={6}>
                        <AddCodeButton onClick={handleAddCodeSnippet}>Add code
                            snippet</AddCodeButton>
                    </Grid>
                    {
                        codebases.map(codebase => {
                            const { name, isCodeSnippet } = codebase;

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
                                            <AiFillGithub fill="white" size={22} />
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
                        {/* <img src="./repository_icon.png" /> */}
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
                    {/* <img src="./manager_icon.png" /> */}
                    <span>Manage codebases</span>
                </div>
            </div>
        )
    }

    /* Lifecycle Methods */

    componentDidMount() {
        this.fetchCodebases();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            renderCodeSnippet,
            renderRepository,
            renderSelectRepository,
            renderSelectCodeSnippet,
            renderIndexingProgress
        } = prevState;
        const prevShouldRenderCodebaseManager = !renderCodeSnippet && !renderRepository && !renderSelectRepository && !renderSelectCodeSnippet && !renderIndexingProgress;
        const shouldRenderCodebaseManager = this.shouldRenderCodebaseManager();

        if (prevShouldRenderCodebaseManager != shouldRenderCodebaseManager && shouldRenderCodebaseManager) {
            this.fetchCodebases();
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
                    {this.renderSecondaryIndexingProgress()}
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
                {this.renderSecondaryIndexingProgress()}
            </div>
        );
    }
}

export default withAuth0(CodeExplorer);