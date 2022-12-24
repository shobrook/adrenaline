import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "./ErrorExplanation.css";

export default class ErrorExplanation extends Component {
	render() {
    const { errorMessage, onDebug } = this.props;

    return (
      <div className="errorExplanation">
        <div className="errorExplanationHeader">
          <span>Error Explanation</span>
					<p>Click "Fix it" to debug and explain your error.</p>
        </div>
      </div>
    );
	}
}
