export const getGitHubRepoFileStructure = async (url) => {
    // TODO: find another durable solution for accessToken
    const accessToken = "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";
    return fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `token ${accessToken}`
        },
    })
        .then(res => res.json())
        .then(data => data.tree.map(file => file.path));
}

export const getGitHubRawFileContent = async (url) => {
    return fetch(url, {
        method: "GET",
        headers: {},
    })
        .then(res => res.text())
}
