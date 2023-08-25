import React, { createRef, Component } from "react";
import { TbCircleX, TbCircleCheck, TbAnalyzeFilled } from "react-icons/tb";
import { CircularProgress } from "@mui/material";
import { withAuth0 } from "@auth0/auth0-react";
import { IndexingStatus } from "./lib/dtos";
import Mixpanel from "./lib/mixpanel";

class IndexingButton extends Component {
    constructor(props) {
        super(props);

        this.openWebsocketConnection = this.openWebsocketConnection.bind(this);
        this.onIndex = this.onIndex.bind(this);

        this.websocketRef = createRef();
        this.state = { indexingProgress: 0.0, indexingMessage: "", isError: false }
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

            if (error != "") {
                this.setState({isError: true, indexingMessage: error});
                return;
            }

            if (is_finished) {
                const { updateIndexingStatus } = this.props;
                this.setState({indexingProgress: 0.0, indexingMessage: "", isError: false});
                updateIndexingStatus(IndexingStatus.Indexed);

                Mixpanel.track("indexed_repository");
            } else {
                this.setState(prevState => {
                    console.log("Got updated")
                    const { indexingProgress } = prevState;
                
                    return {
                        ...prevState,
                        indexingProgress: progress_target ? ((indexingProgress + 1) / progress_target) * 100 : 0.0,
                        indexingMessage: `${step}: <span>${content}</span>`
                    }
                });
            }
        }
        ws.onerror = event => {
            this.websocketRef.current = null;
            Mixpanel.track("websocket_connection_failed");
        };
        ws.onclose = event => {
            this.websocketRef.current = null;
        }
    }

    /* Event Handlers */

    onIndex(reIndex=false) {
        const { repository, updateIndexingStatus } = this.props;
        const { getAccessTokenSilently, user } = this.props.auth0;

        updateIndexingStatus(IndexingStatus.Indexing);
        getAccessTokenSilently()
            .then(token => {
                this.openWebsocketConnection(ws => {
                    if (ws === null) {
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
        let { indexingProgress, indexingMessage } = this.state;

        console.log(indexingMessage)
        console.log(indexingProgress)

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
                <div className="notIndexedButton" onClick={() => this.onIndex(true)}>
                    <TbAnalyzeFilled />
                    <span>Sync repository</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.Indexing) {
            return (
                <div className="indexingButton">
                    {indexingProgress ? (
                        <>
                            <CircularProgress
                                variant="determinate"
                                value={indexingProgress}
                                size="17px"
                                sx={{color:"#DBE2F0"}} 
                            />
                            <span dangerouslySetInnerHTML={{ __html: indexingMessage }} />
                        </>
                    ) : (
                        <>
                            <CircularProgress 
                                variant="indeterminate"
                                size="17px" 
                                sx={{color:"#DBE2F0"}} 
                            />
                            <span>Learning codebase</span>
                        </>
                    )}
                </div>
            );
        }

        return <div />;
    }
}

export default withAuth0(IndexingButton);