import React, { Component } from "react";

import "./Dropdown.css";

const LANGUAGES = [
	{name: "Python", mode: "python"},
	{name: "JavaScript", mode: "javascript"},
	{name: "Java", mode: "clike"},
	{name: "Ruby", mode: "ruby"},
	{name: "PHP", mode: "php"},
	{name: "C++", mode: "clike"},
	{name: "C", mode: "clike"},
	{name: "Shell", mode: "shell"},
	{name: "C#", mode: "clike"},
	{name: "Objective-C", mode: "clike"},
	{name: "R", mode: "r"},
	{name: "Go", mode: "go"},
	{name: "Perl", mode: "perl"},
	{name: "CoffeeScript", mode: "coffeescript"},
	{name: "Scala", mode: "clike"},
	{name: "Haskell", mode: "haskell"},
	{name: "HTML", mode: "htmlmixed"},
	{name: "CSS", mode: "css"},
	{name: "Kotlin", mode: "clike"},
	{name: "Rust", mode: "rust"},
	{name: "SQL", mode: "sql"},
	{name: "Swift", mode: "swift"}
];
export default class Dropdown extends Component {
	render() {
		const { className, value, onSelect } = this.props;

		return (
			<div className={className}>
				<select className="dropdown" onChange={onSelect}>
					{LANGUAGES.map(language => {
						const { name, mode } = language;

						return (<option value={mode}>{name}</option>);
					})}
	     </select>
			</div>
		);
	}
}
