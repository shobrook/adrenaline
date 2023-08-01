import React from 'react';
// import FileIcon from "../components/FileIcon";
// import { ArrowOut } from '../components/ArrowOut';

type Props = {
    onClick: () => void;
    fileName: string;
    skipIcon?: boolean;
};

const FileChip = ({ onClick, fileName, skipIcon }: Props) => {
    return (
        <button className="fileChip" onClick={onClick}>
            <span className="fileLabel">
                {/* {!skipIcon && <FileIcon filename={fileName} noMargin />} */}
                <span className="ellipsis">{fileName}</span>
            </span>
            {/* <span className="clickFileArrow">
                <ArrowOut sizeClassName="w-3.5 h-3.5" />
            </span> */}
        </button>
    );
};

export default FileChip;