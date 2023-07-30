import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

const GeneratedCode = ({ code, language }) => {
    return (
        <div className="generatedCode">
            <SyntaxHighlighter
                className="codeBlock"
                language={language.toLowerCase()}
                style={dracula}
                showLineNumbers={true}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    )
}

// TODO: Add copy button

export default GeneratedCode;