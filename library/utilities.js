
export function buildTreeFromFlatList(flatListArray) {
    if (!flatListArray) {
        return [];
    }

    let result = [];
    let level = { result };

    flatListArray.forEach(path => {
        path.split('/').reduce((r, name) => {
            if (!r[name]) {
                r[name] = { result: [] };
                r.result.push({ name, path, children: r[name].result })
            }

            return r[name];
        }, level)
    })

    return result;
}