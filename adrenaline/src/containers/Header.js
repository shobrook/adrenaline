import React, { Component, Fragment } from "react";
import "./Header.css";

import Button from "../components/Button";

export default class Header extends Component {
	render() {
    const { fileName, isUnsaved, onLintCode, onOptimizeCode, onDocumentCode } = this.props;
		const isFileUntitled = fileName.length === 0;

    return (
      <div className="header">
				<div className="fileNameContainer">
					<span className={isFileUntitled ? "fileName untitled" : "fileName"}>
						{isFileUntitled ? "untitled.py" : fileName}
					</span>
					{isUnsaved ? (<div className="unsavedIcon" />) : null}
				</div>
				<div className="actionButtonsContainer">
					<Button
						className="actionButton"
						isPrimary={true}
						onClick={onLintCode}
					>
						Lint
					</Button>
					<Button
						className="actionButton"
						isPrimary={true}
						onClick={onOptimizeCode}
					>
						Optimize
					</Button>
					<Button
						className="actionButton"
						isPrimary={true}
						onClick={onDocumentCode}
					>
						Document
					</Button>
				</div>
      </div>
    )
	}
}
