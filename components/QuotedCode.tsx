import React from "react";
import { ReactElement } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { AiFillGithub } from "react-icons/ai";

const QuotedCode = ({ code, language, filePath, startLine, repoSource, onClick }) => {
    let filePathParts = filePath.split("/");
    let styledFilePath : ReactElement[] = [];
    filePathParts.forEach((part, index) => {
        if (index == filePathParts.length - 1) {
            styledFilePath.push(<span className="filePathPartFinal">{part}</span>);
        } else {
            styledFilePath.push(<span className="filePathPart">{part}</span>);
        }

        if (index < filePathParts.length - 1) {
            styledFilePath.push(<span className="filePathPartDivider">/</span>);
        }
    });

    return (
        <div className="quotedCode">
            <div className="filePathHeader" onClick={onClick}>
            {repoSource == "github" ? (<AiFillGithub />) : (<img src="./gitlab.svg" />)}
                <span className="filePath">{styledFilePath}</span>
            </div>
            <SyntaxHighlighter
                className="codeBlock"
                language={language.toLowerCase()}
                style={dracula}
                showLineNumbers={true}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

export default QuotedCode;