import { Component } from 'react';

import Button from '../components/Button';

import '../styles/InputField.css';

export default class InputField extends Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSubmitInput = this.onSubmitInput.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.state = { value: "", displaySuggestedMessages: true };
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
        this.setState({ value: "", displaySuggestedMessages: false });
    }

    onKeyPress(event) {
        const code = event.keyCode || event.which;

        if (code === 13) {
            this.onSubmitInput();
        }
    }

	render() {
        const { placeholder, submitLabel, onSubmitSuggested, suggestedMessages } = this.props;
        const { value, displaySuggestedMessages } = this.state;

		return (
			<div id="inputField">
                {suggestedMessages.length != 0 && displaySuggestedMessages ? (
                    <div id="suggestedMessages">
                        {suggestedMessages.map(suggestedMessage => {
                            return (
                                <div 
                                    className="suggestedMessage" 
                                    onClick={() => onSubmitSuggested(suggestedMessage)}
                                >
                                    {suggestedMessage.preview}
                                </div>
                            );
                        })}
                    </div>
                ) : null}
                <div id="inputFieldArea">
                    <input 
                        id="inputFieldValue" 
                        placeholder={placeholder}
                        onChange={this.onChange}
                        value={value}
                        onKeyPress={this.onKeyPress}
                    />
                    <Button 
                        id="sendInputButton" 
                        isPrimary 
                        onClick={this.onSubmitInput}
                        isDisabled={value == ""}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>
		);
	}
}
