import React, { Component } from "react";
import "./FileTab.css";

export default class FileTab extends Component {
	render() {
    const { fileName, isActive } = this.props;

    // TODO: Add onClick handler for closeFileButton
		return (
      <div className="fileTab">
				{isActive ? (<div className="fileIsActiveIndicator" />) : null}
        <div className="fileDetails">
          {/* TODO: Add icon to indicate file type */}
          <span className="fileName">{fileName}</span>
        </div>
      </div>
		);
	}
}
