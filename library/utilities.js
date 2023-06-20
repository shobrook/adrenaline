export function buildTreeFromFlatList(filePaths) {
    const root = { name: '', path: '', children: [] };

    filePaths.forEach(filePath => {
        const pathParts = filePath.split('/');
        let currentNode = root;

        pathParts.forEach((part, index) => {
            let node = currentNode.children.find(child => child.name === part);

            if (!node) {
                node = {
                    name: part,
                    path: pathParts.slice(0, index + 1).join('/'),
                    children: []
                };
                currentNode.children.push(node);
            }

            currentNode = node;
        });
    });

    return root.children;
}