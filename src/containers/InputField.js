import { Component } from 'react';
import { motion } from "framer-motion";

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
                        {suggestedMessages.map((suggestedMessage, index) => {
                            return (
                                <motion.div 
                                    initial={{ translateY: 50 * (3 - index), opacity: 0.0 }}
                                    animate={{ translateY: 0, opacity: 1.0 }}
                                    transition={{ duration: 0.5, delay: 0.5 * index }}
                                    className="suggestedMessage" 
                                    onClick={() => onSubmitSuggested(suggestedMessage)}
                                >
                                    <span>{suggestedMessage.preview}</span>
                                    <svg 
                                        className="sendMessageIcon"
                                        clipRule="evenodd" 
                                        fillRule="evenodd" 
                                        strokeLinejoin="round" 
                                        strokeMiterlimit="2" 
                                        viewBox="0 0 24 24" 
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path 
                                            d="m14.523 18.787s4.501-4.505 6.255-6.26c.146-.146.219-.338.219-.53s-.073-.383-.219-.53c-1.753-1.754-6.255-6.258-6.255-6.258-.144-.145-.334-.217-.524-.217-.193 0-.385.074-.532.221-.293.292-.295.766-.004 1.056l4.978 4.978h-14.692c-.414 0-.75.336-.75.75s.336.75.75.75h14.692l-4.979 4.979c-.289.289-.286.762.006 1.054.148.148.341.222.533.222.19 0 .378-.072.522-.215z" 
                                            fillRule="nonzero"
                                        />
                                    </svg>
                                </motion.div>
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
