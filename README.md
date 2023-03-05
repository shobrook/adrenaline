# Adrenaline

Adrenaline is an AI code debugger powered by large language models. It not only fixes your code, but teaches you along the way.

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

### Error Explanation

Not only does Adrenaline propose fixes for your errors, but it also explains errors in plain English using GPT-3.

### Linting

If your code isn't throwing an exception, it may still contain bugs. Adrenaline can scan your code for potential issues and propose fixes for them, if any exist.

## Roadmap

Right now, Adrenaline is meant to demonstrate what's possible with AI-driven debugging. There's many ways it can be improved:

1. Client-side intelligence (e.g. static code analysis) could be used to build a better prompt for GPT-3.
2. Instead of simply _explaining_ your error, Adrenaline should provide chain-of-thought reasoning for how it fixed the error.
3. In addition to chain-of-thought reasoning, Adrenaline could provide a ChatGPT-style assistant to answer questions about your error. I can even see Adrenaline being repurposed as a "coding tutor" for beginners.
4. Creating a VSCode extension that does this would eliminate the friction of copy-pasting your code and error message into the site.

Ultimately, I believe [specialized models](https://ai.stanford.edu/blog/DrRepair/) trained on all publicly available code will yield even better results. There are interesting research questions here, such as how to generate synthetic training data (i.e. how can you systematically break code in a random but non-trivial way?).

## Acknowledgements

Malik Drabla for helping build the site and initial PoC during [AI Hack Week](https://www.aihackweek.com/). Ramsey Lehman for design feedback. Paul Bogdan, Michael Usachenko, and Samarth Makhija for various other feedback.
