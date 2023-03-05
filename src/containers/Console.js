import { Component } from "react";
import { withAuth0 } from "@auth0/auth0-react";

import Button from "../components/Button";
import Mixpanel from "../library/mixpanel";

import "../styles/Console.css";

class Console extends Component {
    constructor(props) {
        super(props);

        this.wait = this.wait.bind(this);
        this.getOutput = this.getOutput.bind(this);
        this.onRun = this.onRun.bind(this);

        this.state = { output: "", isLoading: false }
    }

    /* Utilities */

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getOutput(submissionId) {
        const { getAccessTokenSilently, user } = this.props.auth0;

        return await getAccessTokenSilently()
            .then(async (token) => {
                return await fetch("https://rubrick-api-production.up.railway.app/api/execution_output", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email,
                        submission_id: submissionId
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        const { output, is_error: isError } = data;

                        if (output) {
                            return { output, isError };
                        }

                        return null;
                    })
                    .catch(error => {
                        console.log(error);
                        return null;
                    })
            })
    }

    /* Event Handlers */

    onRun() {
        const { code, compilerId, onRunFailure, onError } = this.props;
        const {
            isAuthenticated,
            loginWithRedirect,
            getAccessTokenSilently,
            user
        } = this.props.auth0;

        if (code.trim() === "") {
            onRunFailure("Please enter code into the editor before clicking run.");
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

        Mixpanel.track("click_run_code");
        this.setState({ isLoading: true });

        getAccessTokenSilently()
            .then(token => {
                fetch("https://rubrick-api-production.up.railway.app/api/execute_code", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: user.email,
                        code,
                        compiler_id: compilerId
                    })
                })
                    .then(res => res.json())
                    .then(async (data) => {
                        const { submission_id: submissionId } = data;

                        var retryCount = 0;
                        var maxRetries = 5;
                        const retryDelay = 2000;

                        const pollSubmissionStatus = async () => {
                            let result = await this.getOutput(submissionId);
                            retryCount += 1;

                            while (!result) {
                                await this.wait(retryDelay);
                                result = await this.getOutput(submissionId);

                                retryCount += 1;

                                if (retryCount === maxRetries) {
                                    return null;
                                }
                            }

                            return result;
                        }

                        const result = await pollSubmissionStatus();
                        if (result) {
                            Mixpanel.track("run_code_success", { isError });

                            const { output, isError } = result;
                            this.setState({ output, isLoading: false });

                            if (isError) {
                                onError(output);
                            }
                        } else {
                            Mixpanel.track("run_code_failure");
                            this.setState({ isLoading: false });
                            onRunFailure("There was an error processing your request.");
                        }
                    })
                    .catch(error => {
                        Mixpanel.track("run_code_failure");
                        console.log(error);
                        this.setState({ isLoading: false });
                        onRunFailure("There was an error processing your request.");
                    });
            })
    }

    /* Lifecycle Methods */

    render() {
        const { output, isLoading } = this.state;

        return (
            <div id="console">
                <div id="consoleHeader">
                    <span>Output</span>
                    <Button
                        id="runButton"
                        isPrimary
                        onClick={this.onRun}
                        isLoading={isLoading}
                    >
                        Run
                    </Button>
                </div>
                <div id="output">{output}</div>
            </div>
        );
    }
}

export default withAuth0(Console);