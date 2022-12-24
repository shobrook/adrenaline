import React, { Component, Fragment } from "react";

import Button from "../components/Button";

import "./ErrorExplanation.css";

export default class ErrorExplanation extends Component {
	render() {
    const { errorExplanation, onDebug } = this.props;

    return (
      <div className="errorExplanation">
        <div className="errorExplanationHeader">
          <span>Error Explanation</span>
					<p>{
						errorExplanation === "" ?
						"Click \"Fix it\" to debug and explain your error." : errorExplanation
					}</p>
        </div>
      </div>
    );
	}
}
