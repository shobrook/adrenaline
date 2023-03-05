# Adrenaline

Adrenaline is a code debugger powered by large language models. It not only fixes your code, but teaches you along the way.

![Demo](demo.gif)

## Usage

Adrenaline can be used [here.](https://useadrenaline.com/playground) Simply plug in your broken code and an error message (e.g. a stack trace or natural language description of the error) and click "Debug."

### Running Locally

To run locally, clone the repository and run the following:

```bash
$ npm install
$ npm run start-local
```

## Features

### Debugging

Adrenaline processes your code and error message, and returns code changes that might fix your error (or at least give you a starting point). The proposed fixes are displayed in-line like a diff, with the option to accept, reject, or modify each code change.

### Chatbot

Adrenaline provides a chat interface for "rubber ducking" your code. It's powered by ChatGPT, and you can ask it to explain error messages, propose changes, and general questions about your code that may help in the debugging process.

## Roadmap

Right now, Adrenaline is meant to demonstrate what's possible with AI-driven debugging. There's many ways it can be improved:

1. Client-side intelligence (e.g. static code analysis) could be used to build a better prompt for GPT-3.
2. Instead of simply _explaining_ your error, Adrenaline should provide chain-of-thought reasoning for how it fixed the error.
3. Creating a VSCode extension that does this would eliminate the friction of copy-pasting your code and error message into the site.

Ultimately, I believe [specialized models](https://ai.stanford.edu/blog/DrRepair/) trained on all publicly available code will yield even better results. There are interesting research questions here, such as how to generate synthetic training data (i.e. how can you systematically break code in a random but non-trivial way?).

## Acknowledgements

Built by Jonathan Shobrook and Malik Drabla. Ramsey Lehman for design feedback. Paul Bogdan, Michael Usachenko, and Samarth Makhija for various other feedback.
