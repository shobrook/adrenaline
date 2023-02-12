import { Component } from 'react';

import Button from './Button';

import '../styles/InputField.css';

export default class InputField extends Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSubmitInput = this.onSubmitInput.bind(this);

        this.state = { value: "", displaySuggestedMessage: true };
    }

    onChange(event) {
        this.setState({ value: event.target.value });
    }

    onSubmitInput() {
        const { onSubmit } = this.props;
        const { value } = this.state;

        if (value === "") {
            return;
        }
        
        onSubmit(value);
        this.setState({ value: "" });
    }

	render() {
        const { placeholder, submitLabel, onSubmitSuggested, suggestedMessage } = this.props;
        const { value, displaySuggestedMessage } = this.state;

		return (
			<div id="inputField">
                {suggestedMessage && Object.keys(suggestedMessage).length !== 0 && displaySuggestedMessage ? (
                    <div 
                        id="suggestedMessage" 
                        onClick={() => { onSubmitSuggested(); this.setState({ displaySuggestedMessage: false }); }}
                    >
                        {suggestedMessage.preview}
                    </div>
                ) : null}
                <div id="inputFieldArea">
                    <textarea 
                        id="inputFieldValue" 
                        placeholder={placeholder}
                        onChange={this.onChange}
                        value={value}
                    >
                        {value}
                    </textarea>
                    <Button 
                        id="sendInputButton" 
                        isPrimary 
                        onClick={this.onSubmitInput}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>
		);
	}
}
