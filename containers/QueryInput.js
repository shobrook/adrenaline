import { withAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import { TextareaAutosize, TextareaAutosizeProps } from "@mui/material";
import { motion } from "framer-motion";

const QueryInput = (props) => {
  const { onSubmitQuery, suggestedMessages, isBlocked } = props;
  const [query, setQuery] = useState("");
  const textAreaRef = useRef(null);
  const onChangeQuery = (event) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && query !== "" && !isBlocked) {
      event.preventDefault();
      onSubmit(event.target.value);
      setQuery("");
    }
  };

  const onSubmit = () => {
    if (query !== "" && !isBlocked) {
      onSubmitQuery(query);
      setQuery("");
    }
  };

  const onSubmitSuggested = suggestedMessage => {
    const { content } = suggestedMessage;
    onSubmitQuery(content);
  }

  return (
    <div className="chatContainer">
      <div id="suggestedMessages">
          {suggestedMessages.map((suggestedMessage, index) => {
              const numSuggestedMessages = suggestedMessages.length;
              return (
                  <motion.div 
                      initial={{ translateY: 50 * (numSuggestedMessages - index), opacity: 0.0 }}
                      animate={{ translateY: 0, opacity: 1.0 }}
                      transition={{ duration: 0.5, delay: 0.5 * index }}
                      className="suggestedMessage" 
                      onClick={() => onSubmitSuggested(suggestedMessage)}
                  >
                      <span>{suggestedMessage.preview}</span>
                      <svg 
                          className="sendMessageIcon"
                          clipRule="evenodd" 
                          fillRule="evenodd" 
                          strokeLinejoin="round" 
                          strokeMiterlimit="2" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                      >
                          <path 
                              d="m14.523 18.787s4.501-4.505 6.255-6.26c.146-.146.219-.338.219-.53s-.073-.383-.219-.53c-1.753-1.754-6.255-6.258-6.255-6.258-.144-.145-.334-.217-.524-.217-.193 0-.385.074-.532.221-.293.292-.295.766-.004 1.056l4.978 4.978h-14.692c-.414 0-.75.336-.75.75s.336.75.75.75h14.692l-4.979 4.979c-.289.289-.286.762.006 1.054.148.148.341.222.533.222.19 0 .378-.072.522-.215z" 
                              fillRule="nonzero"
                          />
                      </svg>
                  </motion.div>
              );
          })}
      </div>
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
            Ask AI
          </Button>
        </div>
      </form>
    </div>
  );
};

export default withAuth0(QueryInput);
