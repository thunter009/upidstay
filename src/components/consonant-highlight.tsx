"use client";


interface ConsonantHighlightProps {
  text: string;
}

export function ConsonantHighlight({ text }: ConsonantHighlightProps) {
  const words = text.split(" ");

  return (
    <span>
      {words.map((word, i) => (
        <span key={i}>
          <HighlightedWord word={word} />
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

function HighlightedWord({ word }: { word: string }) {
  // For pig latin words ending in "ay", highlight the moved consonant cluster
  const match = word.match(/^(.+?)([a-zA-Z]*ay)([^a-zA-Z]*)$/);
  if (!match) return <span>{word}</span>;

  const [, body, suffix, trailing] = match;

  // Extract the cluster from the suffix (everything before "ay")
  const clusterPart = suffix.slice(0, -2);
  if (!clusterPart || clusterPart === "w") {
    // vowel-start word (ends in "way") — no cluster to highlight
    return <span>{word}</span>;
  }

  return (
    <span>
      {body}
      <span className="text-pink-500 font-bold">{clusterPart}</span>
      <span className="text-pink-400">ay</span>
      {trailing}
    </span>
  );
}
