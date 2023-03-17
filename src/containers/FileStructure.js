import * as React from 'react';
import {useState} from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@mui/material/SvgIcon';
import {alpha, styled} from '@mui/material/styles';
import TreeView from '@mui/lab/TreeView';
import TreeItem, {treeItemClasses} from '@mui/lab/TreeItem';
import Collapse from '@mui/material/Collapse';
import {useSpring, animated} from '@react-spring/web';
import useSWR from 'swr'

import '../styles/FileStructure.css';
import {buildTreeFromFlatList} from "../library/utilities";
import InputField from "./InputField";
import {getGitHubRawFileContent, getGitHubRepoFileStructure} from "../library/requests";

function MinusSquare(props) {
    return (
        <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z"/>
        </SvgIcon>
    );
}

function PlusSquare(props) {
    return (
        <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z"/>
        </SvgIcon>
    );
}

function CloseSquare(props) {
    return (
        <SvgIcon
            className="close"
            fontSize="inherit"
            style={{width: 14, height: 14}}
            {...props}
        >
            {/* tslint:disable-next-line: max-line-length */}
            <path
                d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z"/>
        </SvgIcon>
    );
}

function TransitionComponent(props) {
    const style = useSpring({
        from: {
            opacity: 0,
            transform: 'translate3d(20px,0,0)',
        },
        to: {
            opacity: props.in ? 1 : 0,
            transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
        },
    });

    return (
        <animated.div style={style}>
            <Collapse {...props} />
        </animated.div>
    );
}

TransitionComponent.propTypes = {
    /**
     * Show the component; triggers the enter or exit states
     */
    in: PropTypes.bool,
};

const StyledTreeItem = styled((props) => (
    <TreeItem {...props} TransitionComponent={TransitionComponent}/>
))(({theme}) => ({
    [`& .${treeItemClasses.iconContainer}`]: {
        '& .close': {
            opacity: 0.3,
        },
    },
    [`& .${treeItemClasses.group}`]: {
        marginLeft: 15,
        paddingLeft: 18,
        borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
}));

export default function FileStructure({onSelectedFile}) {
    const [repoURL, setRepoURL] = useState(localStorage.getItem('repoURL'));

    const getFinalURL = (inputURL) => {
        // TODO: "master" branch is hardcoded. Handle this dynamically
        return `${inputURL.replace("https://github.com/", "https://api.github.com/repos/").replace(/\/$/, '')}/git/trees/master?recursive=1`
    }

    const {data} = useSWR(repoURL ? getFinalURL(repoURL) : null, getGitHubRepoFileStructure);

    const treeFiles = buildTreeFromFlatList(data);

    const renderTreeLevel = (level, index) => {
        const onFlickClick = async () => {
            // TODO: "master" branch is hardcoded. Handle this dynamically
            const rawGitHubContentURL = `${repoURL.replace('https://github.com', 'https://raw.githubusercontent.com').replace(/\/$/, '')}/master/${level.path}`;

            const fileContent = await getGitHubRawFileContent(rawGitHubContentURL);
            onSelectedFile(fileContent);
        }

        if (level.children.length === 0) {
            return <StyledTreeItem key={index} nodeId={`${level.name}->${index}`} label={level.name} onClick={onFlickClick}/>
        } else {
            return (
                <StyledTreeItem key={index} nodeId={`${level.name}->${index}`} label={level.name}>
                    {level.children.map((level, index) => {
                        return renderTreeLevel(level, index);
                    })}
                </StyledTreeItem>
            );
        }
    }

    return (
        <div className="fileStructureWrapper">
            <InputField
                onSubmit={(val) => {
                    localStorage.setItem('repoURL', val);
                    setRepoURL(val);
                }}
                initialValue={repoURL}
                suggestedMessages={[]}
                placeholder="https://github.com/shobrook/adrenaline"
                submitLabel="Import"
            />

            <TreeView
                aria-label="customized"
                defaultExpanded={['1']}
                defaultCollapseIcon={<MinusSquare/>}
                defaultExpandIcon={<PlusSquare/>}
                defaultEndIcon={<CloseSquare/>}
                sx={{height: 264, flexGrow: 1, maxWidth: 400, overflowY: 'auto'}}
            >
                <StyledTreeItem nodeId="1" label="Main">
                    {
                        treeFiles.map((level, index) => renderTreeLevel(level, index))
                    }
                </StyledTreeItem>
            </TreeView>
        </div>
    );
}
