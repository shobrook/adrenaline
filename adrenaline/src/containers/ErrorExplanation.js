import React, { Component, useState, useEffect } from 'react';

import "./ErrorExplanation.css";

export default class ErrorExplanation extends Component {
	constructor(props) {
		super(props);

		this.state = { currentWordIndex: 0 };
	}

	isErrorExplanationEmpty = () => {
		const { errorExplanation } = this.props;
		return errorExplanation === "";
	}

	isErrorExplanationFullyRendered = () => {
		const { errorExplanation } = this.props;
		const { currentWordIndex } = this.state;

		return currentWordIndex >= errorExplanation.split(" ").length;
	}

	componentDidMount() {
		const delay = 75;
		this.interval = setInterval(() => {
 			if (this.isErrorExplanationEmpty()){
				return;
			}

			this.setState(prevState => ({ currentWordIndex: prevState.currentWordIndex + 1 }));
		}, delay);
	}

	componentDidUpdate() {
		const { errorExplanation } = this.props;
		const { currentWordIndex } = this.state;

		if (!this.isErrorExplanationEmpty() && this.isErrorExplanationFullyRendered()) {
			clearInterval(this.interval);
		}
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	render() {
		const { errorExplanation } = this.props;
		const { currentWordIndex } = this.state;

		const words = errorExplanation.split(' ');
	  const currentText = words.slice(0, currentWordIndex).join(' ');

	  return (
			<div className="errorExplanation">
				<div className="errorExplanationHeader">
					<span>Error Explanation</span>
					{errorExplanation === "" ? (
						<p>Provide an error message and click <b>Debug</b> to explain and fix your error using GPT-3.</p>
					) : (<p>{currentText}</p>)}
				</div>
			</div>
		);
	}
}
