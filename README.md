# Adrenaline

Adrenaline is a debugging assistant powered by the OpenAI Codex. It can fix and explain your broken code in seconds.

## Usage

Adrenaline can be used at https://useadrenaline.com. Simply visit the site, paste your broken code and an error message (e.g. a stack trace, or a description of the error), and click "Debug".

To run locally, clone the repository and run the following:

```bash
$ npm install
$ npm run start-local
```

> Note that users will have to supply their own OpenAI API key from the OpenAI Console. This is to prevent API misuse.

## Features

### Debugging

Adrenaline sends your code and error message to the OpenAI Edit & Insert API (`code-davinci-edit-001`), which sends back code edits which might fix your error. The proposed fixes are displayed in-line like a diff, with the option to accept, reject, or modify each code change.

### Error Explanation

Not only does Adrenaline propose fixes for your errors, but it also explains errors in plain English using GPT-3 (`text-davinci-003`).

### Linting

If your code isn't throwing an exception, but may still contain bugs, Adrenaline can also use the OpenAI Codex to scan your code for issues and propose fixes for them, if any exist.

## Roadmap

In its current instantiation, Adrenaline is just a simple PoC that demonstrates what's possible with AI-driven debugging. Here are some ideas for how it could be improved:

1. Client-side intelligence (e.g. static code analysis) could be used to build a better prompt for GPT-3.
2. Not only should Adrenaline _explain_ your error, it should provide a ChatGPT-style assistant to answer questions about your error.
3. Creating a VSCode extension that does this would eliminate the friction of copy-pasting your code and error message into the site.

Ultimately, while the OpenAI Codex is surprisingly good at debugging code (or at least providing a starting point), I believe [a more specialized model](https://ai.stanford.edu/blog/DrRepair/) trained on all publicly available code could yield better results.

## Acknowledgements

Malik Drabla for helping build the initial PoC. Ramsey Lehman for design feedback. Paul Bogdan, Samarth Makhija, and Michael Usachenko for various feedback.
