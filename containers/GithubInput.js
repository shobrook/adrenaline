import { withAuth0 } from "@auth0/auth0-react";
import { Component } from "react";
import toast from "react-hot-toast";

import Button from "../components/Button";
import ExampleRepository from "../components/ExampleRepository";

import { Repository } from "../library/data";
import Mixpanel from "../library/mixpanel";

class GithubInput extends Component {
    constructor(props) {
        super(props);

        this.getRepoNameFromUrl = this.getRepoNameFromUrl.bind(this);

        this.onSelectExampleRepository = this.onSelectExampleRepository.bind(this);
        this.onChangeGithubUrl = this.onChangeGithubUrl.bind(this);
        this.onSubmitGithubUrl = this.onSubmitGithubUrl.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { githubUrl: "", secondaryIndexingProgressId: null };
    }

    /* Utilities */

    getRepoNameFromUrl() {
        let { githubUrl } = this.state;
        githubUrl = githubUrl.trim();

        if (githubUrl.endsWith("/")) {
            githubUrl = githubUrl.slice(0, githubUrl.length - 1);
        }

        const components = githubUrl.split("/");
        const repoName = components.slice(-2).join("/");

        return repoName;
    }

    /* Event Handlers */

    onSelectExampleRepository(codebaseId) {
        this.setState({ githubUrl: `https://github.com/${codebaseId}` }, this.onSubmitGithubUrl);
    }

    onChangeGithubUrl(event) {
        this.setState({ githubUrl: event.target.value });
    }

    onSubmitGithubUrl() {
        const { onSetProgressMessage, onSetCodebase } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;
        const { githubUrl } = this.state;

        if (githubUrl == "") {
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
                this.websocket = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}index_repository`);

                this.websocket.onopen = event => {
                    const request = {
                        user_id: user.sub,
                        token: token,
                        repo_name: this.getRepoNameFromUrl(),
                        refresh_index: false // TEMP
                    };

                    this.websocket.send(JSON.stringify(request));

                    onSetProgressMessage("Scraping repository");
                    Mixpanel.track("Scrape public repository")
                };
                this.websocket.onmessage = async event => {
                    const { secondaryIndexingProgressId } = this.state;
                    const {
                        message,
                        metadata,
                        is_final,
                        is_paywalled,
                        is_fast,
                        error_message
                    } = JSON.parse(event.data);

                    if (error_message != "") {
                        toast.error(error_message, {
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
                        onSetProgressMessage("", true);
                        return;
                    }

                    if (is_fast) {
                        if (is_final) {
                            onSetProgressMessage("");

                            if (is_paywalled) {
                                const repository = new Repository("", "", {});
                                await onSetCodebase(repository, is_paywalled);
                            } else {
                                const { codebase_id, name, files } = metadata;
                                const repository = new Repository(codebase_id, name, files);
                                await onSetCodebase(repository, is_paywalled);
                            }
                        } else {
                            onSetProgressMessage(message);
                        }
                    } else {
                        if (is_final) {
                            toast.dismiss(secondaryIndexingProgressId);
                            toast.success("Fine-tuning complete. Chatbot is fully optimized.", { id: secondaryIndexingProgressId });
                            this.websocket.close();
                        } else {
                            const toastId = toast.loading("Fine-tuning chatbot on your code. Output will continuously improve until complete.");
                            this.setState({ secondaryIndexingProgressId: toastId });
                        }
                    }
                }
                this.websocket.onerror = event => {
                    console.log("gh input ws error")
                    console.log(event)
                    onSetProgressMessage("", true);
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

    onKeyPress(event) {
        const code = event.keyCode || event.which;

        if (code === 13) {
            this.onSubmitGithubUrl();
        }
    }

    /* Lifecycle Methods */

    render() {
        const { githubUrl } = this.state;

        return (
            <>
                <div id="inputField" className="githubInput">
                    <div id="inputFieldArea">
                        <img id={githubUrl == "" ? "passiveLink" : "activeLink"} src="./link_icon.png" />
                        <input
                            id="inputFieldValue"
                            placeholder="Github repository link"
                            onChange={this.onChangeGithubUrl}
                            value={githubUrl}
                            onKeyPress={this.onKeyPress}
                        />
                        <Button
                            id="sendInputButton"
                            isPrimary
                            onClick={this.onSubmitGithubUrl}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                <span id="exampleRepositoriesTitle">Examples</span>

                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("hwchase17/langchain")}
                >
                    hwchase17/langchain
                </ExampleRepository>
                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("psf/requests")}
                >
                    psf/requests
                </ExampleRepository>
                <ExampleRepository
                    onClick={() => this.onSelectExampleRepository("shobrook/adrenaline")}
                >
                    shobrook/adrenaline
                </ExampleRepository>
            </>
        );
    }
}

export default withAuth0(GithubInput);