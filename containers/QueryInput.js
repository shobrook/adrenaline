import { withAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState} from "react";
import Button from "../components/Button";

const  QueryInput = (props) => {
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState(1);
    const textAreaRef = useRef(null);
    const { placeholder, minRows, maxRows, onSubmitQuery } = props;

    const onChangeQuery =(event) => {
        const textarea = event.target;
        const previousRows = textarea.rows;
        const currentRows = ~~(textarea.scrollHeight / 24);
        textarea.rows = currentRows < maxRows ? currentRows : maxRows;
        setQuery(event.target.value);
        setRows(currentRows);
        if (currentRows === previousRows) {
            textarea.scrollTop = textarea.scrollHeight;
        }
    }

    const onSubmit = () => {
        if (query !== '') {
            onSubmitQuery(query);
            setQuery('');
            setRows(1);
            textAreaRef.current.style.height = `${24 * (minRows || 1) * 1.5}px`;
        }
    }

    const handleKeyDown = (event) => {
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const previousRows = textarea.rows;
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxRows = Math.floor(textarea.clientHeight / lineHeight);
        const currentRows = ~~(textarea.scrollHeight / lineHeight);

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit(value);
            setQuery("");
            setRows(1);
        } else if (event.key === "Enter" && event.key === "Shift") {
            event.preventDefault();
            textarea.value = value.substring(0, start) + "\n" + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            textarea.scrollTop = textarea.scrollHeight;
        } else if (event.key === "Backspace" && value === "" && previousRows > 1) {
            event.preventDefault();
            textarea.rows = previousRows - 1;
            setRows(previousRows - 1);
        } else {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
            if (currentRows < maxRows) {
                textarea.rows = currentRows;
                setRows(currentRows);
            }
        }
    };

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.rows = 1;
        }
    }, [query.length === 0]);

    return (
        <div className="chatContainer">
            <form className="chatForm" onSubmit={onSubmit}>
                <div id="chatInputContainer">
                <textarea
                    ref={textAreaRef}
                    value={query}
                    rows={rows}
                    onChange={onChangeQuery}
                    onKeyDown={handleKeyDown}
                    className="chatTextarea"
                    placeholder="Ask a question"
                />
                <Button
                    id="chatSubmitButton"
                    isPrimary
                    type="submit"
                >
                    Ask
                </Button>
                </div>
            </form>
        </div>
    );
}

export default withAuth0(QueryInput);
