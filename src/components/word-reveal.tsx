"use client";

import { useState, useCallback } from "react";

interface WordRevealProps {
  pigLatin: string;
  english: string;
}

export function WordReveal({ pigLatin, english }: WordRevealProps) {
  const pigWords = pigLatin.split(" ");
  const engWords = english.split(" ");
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);

  const handleTap = useCallback((idx: number) => {
    setRevealedIdx(idx);
    setTimeout(() => setRevealedIdx(null), 2000);
  }, []);

  return (
    <span>
      {pigWords.map((word, i) => (
        <span key={i}>
          <span
            onClick={() => handleTap(i)}
            className={`cursor-pointer inline-block transition-all duration-300 rounded px-0.5 ${
              revealedIdx === i
                ? "bg-yellow-200 text-yellow-800"
                : "hover:bg-purple-100"
            }`}
          >
            {revealedIdx === i ? engWords[i] ?? word : word}
          </span>
          {i < pigWords.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
