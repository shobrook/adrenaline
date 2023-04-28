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