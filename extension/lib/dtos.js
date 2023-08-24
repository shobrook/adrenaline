export class Repository {
    constructor(owner, name, branch="main") {
        this.owner = owner;
        this.name = name;
        this.branch = branch;
        this.fullPath = `${owner}/${name}`;
    }
}

export class Message {
    constructor(content, isResponse, isComplete) {
        this.content = content;
        this.isResponse = isResponse;
        this.isComplete = isComplete; // Indicates whether message has finished streaming
        this.progressMessage = null;
        this.isError = false;
    }
}

export const IndexingStatus = Object.freeze({
    NotIndexed: "notIndexed",
    FailedToIndex: "failedToIndex",
    IndexedButStale: "indexedButStale",
    Indexed: "indexed"
});