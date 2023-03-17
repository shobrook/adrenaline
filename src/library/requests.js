export const getGitHubRepoFileStructure = async (url) => {
    // TODO: find another durable solution for accessToken
    const accessToken = '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';
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
