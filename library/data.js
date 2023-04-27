export class Repository {
    constructor(codebaseId, name, files, isPrivate = false) {
        this.codebaseId = codebaseId;
        this.name = name;
        this.files = files;
        // this.language;
        // this.lastUpdated;
        this.isPrivate = isPrivate;
        this.isCodeSnippet = false;
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