import React, { useState, useEffect } from 'react';

import "./ErrorExplanation.css";

export default function ErrorExplanation({ errorExplanation, delay=50 }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex(currentWordIndex + 1);
    }, delay);
    return () => clearInterval(interval);
  }, [currentWordIndex, delay]);

  const words = errorExplanation.split(' ');
  const currentText = words.slice(0, currentWordIndex).join(' ');

  return (
		<div className="errorExplanation">
			<div className="errorExplanationHeader">
				<span>Error Explanation</span>
				<p>{
					currentText === "" ?
					"Click \"Fix it\" to debug and explain your error." : currentText
				}</p>
			</div>
		</div>
	)
}
