export class Message {
    constructor(content, isResponse, isComplete, isPaywalled = false, sources = []) {
        this.content = content;
        this.isResponse = isResponse;
        this.isComplete = isComplete; // Indicates whether message has finished streaming
        this.isPaywalled = isPaywalled;
        this.sources = sources;
        this.steps = [];
        this.progress = 0;
        this.progressTarget = null;
    }
}

export class Repository {
    constructor(codebaseId, name, files, isPrivate = false, isGitLab = false) {
        this.codebaseId = codebaseId;
        this.name = name;
        this.files = files;
        // this.language;
        // this.lastUpdated;
        this.isPrivate = isPrivate;
        this.isCodeSnippet = false;
        this.isGitLab = isGitLab;
    }
}

export class CodeSnippet {
    constructor(codebaseId, name, code, language) {
        this.codebaseId = codebaseId;
        this.name = name;
        this.code = code;
        this.language = language;

        this.isCodeSnippet = true;
    }
}

export class Source {
    constructor(filePath) {
        const pathComponents = filePath.split("/");
        this.name = pathComponents[pathComponents.length - 1];
        this.filePath = filePath;
    }
}