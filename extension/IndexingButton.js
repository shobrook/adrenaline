import React, { Component } from "react";
import { TbCircleX, TbCircleCheck, TbAnalyzeFilled } from "react-icons/tb";
import { CircularProgress } from "@mui/material";
import { IndexingStatus } from "./lib/dtos";

export default class IndexingButton extends Component {
    constructor(props) {
        super(props);

        this.onIndex = this.onIndex.bind(this);

        this.state = { indexingProgress: 0.0, indexingMessage: "" }
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
            if (event.data == "ping") {
                ws.send("pong");
                return;
            }

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
                // ws.close();
                // this.websocket = null;
            } else {
                this.onSetProgressMessage(step, content, progress_target);
            }
        }
        ws.onerror = event => {
            this.websocketRef.current = null;
            this.onSetProgressMessage("", "", false, null, true);
            window.removeEventListener("beforeunload", this.onBeforeUnload);

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
        ws.onclose = event => {
            this.websocketRef.current = null;
            window.removeEventListener("beforeunload", this.onBeforeUnload);
        }
    }

    /* Event Handlers */

    onIndex() {
        const { repository, updateIndexingStatus } = this.props;

        updateIndexingStatus(IndexingStatus.Indexing)

        // TODO: Open websocket connection and send index request
    }

    /* Lifecycle Methods */

    render() {
        const { repository } = this.props;
        const { indexingMessage } = this.state;

        repository.indexingStatus = IndexingStatus.IndexedButStale;

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
                <div className="staleIndexButton" onClick={this.onIndex}>
                    <TbAnalyzeFilled />
                    <span>{repository.numCommitsBehind ?? 0} commits behind</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.NotIndexed) {
            return (
                <div className="notIndexedButton">
                    <TbAnalyzeFilled />
                    <span>Sync repository</span>
                </div>
            );
        } else if (repository.indexingStatus === IndexingStatus.Indexing) {
            return (
                <div className="indexingButton">
                    <CircularProgress />
                    <span>{indexingMessage ? indexingMessage : "Learning codebase"}</span>
                </div>
            );
        }

        return <div />;
    }
}