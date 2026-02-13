"use client";

import { motion } from "framer-motion";
import { getAvatarEmoji, type DifficultyLevel } from "@/lib/types";
import { speak, isSpeechSynthesisSupported } from "@/lib/speech";
import { WordReveal } from "./word-reveal";
import { ConsonantHighlight } from "./consonant-highlight";

interface MessageBubbleProps {
  message: {
    id: string;
    username: string;
    avatar: string;
    english: string;
    pigLatin: string;
    timestamp: number;
  };
  isOwn: boolean;
  difficulty: DifficultyLevel;
}

export function MessageBubble({ message, isOwn, difficulty }: MessageBubbleProps) {
  const isSystem = message.username === "";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-gray-400 text-base py-1"
      >
        {message.english}
      </motion.div>
    );
  }

  const displayText = isOwn ? message.english : message.pigLatin;
  const showTTS = !isOwn && isSpeechSynthesisSupported();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="text-3xl flex-shrink-0">{getAvatarEmoji(message.avatar)}</div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isOwn
            ? "bg-sky-400 text-white rounded-br-sm"
            : "bg-white text-gray-800 shadow-md rounded-bl-sm"
        }`}
      >
        <div className={`text-xs font-bold mb-1 ${isOwn ? "text-sky-100" : "text-gray-400"}`}>
          {message.username}
        </div>
        <div className="text-lg leading-snug">
          {isOwn ? (
            displayText
          ) : difficulty === "explorer" ? (
            <ExplorerView english={message.english} pigLatin={message.pigLatin} />
          ) : difficulty === "detective" ? (
            <WordReveal pigLatin={message.pigLatin} english={message.english} />
          ) : (
            displayText
          )}
        </div>
        {showTTS && (
          <button
            onClick={() => speak(message.pigLatin)}
            className="mt-1 text-xl opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Read aloud"
          >
            🔊
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ExplorerView({ english, pigLatin }: { english: string; pigLatin: string }) {
  return (
    <div className="space-y-1">
      <ConsonantHighlight text={pigLatin} />
      <div className="text-sm text-gray-400 italic">{english}</div>
    </div>
  );
}
