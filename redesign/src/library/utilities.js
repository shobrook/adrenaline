import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

export function withRouter(Component) {
    function ComponentWithRouterProp(props) {
        let location = useLocation();
        let navigate = useNavigate();
        let params = useParams();

        return (
            <Component
                {...props}
                router={{ location, navigate, params }}
            />
        );
    }

    return ComponentWithRouterProp;
}

export function getLanguageFromFile(filePath) {
    return "python"; // TODO
}

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