import React, { createRef, Component } from "react";
import { TbCircleX, TbCircleCheck, TbAnalyzeFilled } from "react-icons/tb";
import { CircularProgress, Tooltip } from "@mui/material";
import { withAuth0 } from "@auth0/auth0-react";
import { IndexingStatus } from "./lib/dtos";
import Mixpanel from "./lib/mixpanel";

class IndexingButton extends Component {
    constructor(props) {
        super(props);

        this.openWebsocketConnection = this.openWebsocketConnection.bind(this);
        this.onIndex = this.onIndex.bind(this);

        this.websocketRef = createRef();
        this.state = { indexingProgress: 0, progressTarget: null, indexingMessage: "" }
    }

    /* Utilities */

    openWebsocketConnection(callback) {
        if (this.websocketRef.current != null || this.websocketRef.current != undefined) {
            callback(this.websocketRef.current);
            return;
        }

        let ws = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URI}index_repository`);
        ws.onopen = event => {
            this.websocketRef.current = ws;
            callback(ws);
        }
        ws.onmessage = async event => {
            if (event.data == "ping") { // Keepalive mechanism
                ws.send("pong");
                return;
            }

            const {
                content,
                step,
                progress_target,
                is_finished,
                error
            } = JSON.parse(event.data);
            const { updateIndexingStatus } = this.props;

            if (error != "") {
                updateIndexingStatus(IndexingStatus.FailedToIndex);
                return;
            }

            if (is_finished) {
                this.setState({indexingProgress: 0, progressTarget: null, indexingMessage: "", isError: false});
                updateIndexingStatus(IndexingStatus.Indexed);

                Mixpanel.track("indexed_repository");
            } else {
                this.setState(prevState => {
                    const { indexingMessage, indexingProgress, progressTarget } = prevState;

                    console.log(indexingMessage)
                    console.log(indexingProgress)
                    console.log(progressTarget)
                    console.log()
                
                    return {
                        ...prevState,
                        indexingProgress: progress_target == progressTarget ? (indexingProgress + 1) : 1,
                        progressTarget: progress_target,
                        indexingMessage: content ? `${step}: <span>${content}</span>` : step
                    }
                });
            }
        }
        ws.onerror = event => {
            this.websocketRef.current = null;
            updateIndexingStatus(IndexingStatus.FailedToIndex);
            Mixpanel.track("websocket_connection_failed");
        };
        ws.onclose = event => {
            this.websocketRef.current = null;
        }
    }

    /* Event Handlers */

    async onIndex(reIndex=false) {
        const { repository, updateIndexingStatus } = this.props;
        const { getAccessTokenSilently, user } = this.props.auth0;

        await updateIndexingStatus(IndexingStatus.Indexing);
        getAccessTokenSilently()
            .then(token => {
                this.openWebsocketConnection(ws => {
                    if (ws === null) {
                        updateIndexingStatus(IndexingStatus.FailedToIndex);
                        return;
                    }

                    const request = {
                        user_id: user.sub,
                        token,
                        repo_name: repository.fullPath,
                        refresh_index: reIndex,
                        is_gitlab: false
                    };
                    ws.send(JSON.stringify(request));

                    Mixpanel.track("index_repository", { repositoryPath: repository.fullPath, reIndex });
            });
        });
    }

    /* Lifecycle Methods */

    render() {
        const { repository } = this.props;
        let { indexingProgress, progressTarget, indexingMessage } = this.state;

        if (repository.indexingStatus === IndexingStatus.Indexed) {
            return (
                <div className="isIndexedButton">
                    <TbCircleCheck />
                    <span>Up to date</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.FailedToIndex) {
            return (
                <div className="failedIndexButton">
                    <TbCircleX />
                    <span>Failed to sync</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.IndexedButStale) {
            return (
                <div className="staleIndexButton" onClick={() => this.onIndex(true)}>
                    <TbAnalyzeFilled />
                    <span>{repository.numCommitsBehind ?? 0} commits behind</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.NotIndexed) {
            return (
                <Tooltip 
                    title="You must sync this repository before asking questions." 
                    open 
                    arrow
                    placement="right"
                    classes={{tooltip: "indexingTooltip"}}
                >
                    <div className="notIndexedButton" onClick={() => this.onIndex(true)}>
                        <TbAnalyzeFilled />
                        <span>Sync repository</span>
                    </div>
                </Tooltip>
            );
        } else if (repository.indexingStatus === IndexingStatus.Indexing) {
            if (indexingMessage) {
                let progressValue = 101;
                if (progressTarget) {
                    progressValue = (indexingProgress / progressTarget) * 100;
                    if (indexingMessage.toLowerCase().startsWith("scraping")) {
                        progressValue *= 0.5;
                    }
                }

                if (progressValue > 100) {
                    return (
                        <div className="indexingButton">
                            <CircularProgress
                                variant="indeterminate"
                                size="17px"
                                sx={{color:"#DBE2F0"}} 
                            />
                            <span className="indexingMessage" dangerouslySetInnerHTML={{ __html: indexingMessage }} />
                        </div>
                    );
                }

                return (
                    <div className="indexingButton">
                        <CircularProgress
                            variant="determinate"
                            value={progressValue}
                            size="17px"
                            sx={{color:"#DBE2F0"}} 
                        />
                        <span className="indexingMessage" dangerouslySetInnerHTML={{ __html: indexingMessage }} />
                    </div>
                );
            }

            return (
                <div className="indexingButton">
                    <CircularProgress 
                        variant="indeterminate"
                        size="17px" 
                        sx={{color:"#DBE2F0"}} 
                    />
                    <span>Learning codebase</span>
                </div>
            );
        }

        return <div />;
    }
}

export default withAuth0(IndexingButton);