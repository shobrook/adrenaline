import { withAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import { TextareaAutosize, TextareaAutosizeProps } from "@mui/material";
const QueryInput = (props) => {
  const { onSubmitQuery } = props;
  const [query, setQuery] = useState("");
  const textAreaRef = useRef(null);
  const onChangeQuery = (event) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event.target.value);
      setQuery("");
    }
  };

  const onSubmit = () => {
    if (query !== "") {
      onSubmitQuery(query);
      setQuery("");
    }
  };

  return (
    <div className="chatContainer">
      <form className="chatForm" onSubmit={onSubmit}>
        <div id="chatInputContainer">
          <TextareaAutosize
            ref={textAreaRef}
            minRows={1}
            maxRows={10}
            className="chatTextarea"
            value={query}
            onChange={onChangeQuery}
            placeholder="Ask a question..."
            onKeyDown={handleKeyDown}
          />
          <Button
            id="chatSubmitButton"
            isPrimary
            type="submit"
            onClick={onSubmit}
          >
            Ask
          </Button>
        </div>
      </form>
    </div>
  );
};

export default withAuth0(QueryInput);
