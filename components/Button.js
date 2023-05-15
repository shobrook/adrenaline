import { Component } from "react";

export default class Button extends Component {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	}

	onClick() {
		const { isLoading, onClick } = this.props;

		if (isLoading) {
			return null;
		}

		if(onClick){
			return this.props.onClick();
		}
	}

	render() {
		const {
			id,
			className,
			isPrimary,
			children
		} = this.props;

		return (
			<div
				id={id}
				className={`${className} ${isPrimary ? "primaryButton" : "secondaryButton"}`}
				onClick={this.onClick}
			>
				{children}
			</div>
		);
	}
}
