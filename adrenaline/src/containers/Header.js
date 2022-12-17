import React, { Component, Fragment } from "react";
import "./Header.css";

import FileTab from "../components/FileTab";

export default class Header extends Component {
	render() {
    const { fileName, filePath} = this.props;

    return (
      <div className="header">
        <FileTab
          fileName={fileName}
          isActive={true}
        />
        {/* TODO: Add button for opening file */}
      </div>
    )
	}
}
