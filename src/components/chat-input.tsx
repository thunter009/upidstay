"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toPigLatin } from "@/lib/pig-latin";
import { isSpeechRecognitionSupported, createRecognition } from "@/lib/speech";
import { playSendSound } from "@/lib/sounds";

interface ChatInputProps {
  onSend: (english: string, pigLatin: string) => void;
  onTyping: () => void;
  soundEnabled: boolean;
}

export function ChatInput({ onSend, onTyping, soundEnabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const showMic = isSpeechRecognitionSupported();

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (soundEnabled) playSendSound();
    onSend(trimmed, toPigLatin(trimmed));
    setText("");
    inputRef.current?.focus();
  }, [text, onSend, soundEnabled]);

  const handleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = createRecognition(
      (result) => {
        setText(result);
        setListening(false);
      },
      () => setListening(false)
    );
    if (!rec) return;
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  return (
    <div className="flex gap-2 items-center p-3 bg-white border-t-2 border-gray-100">
      {showMic && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMic}
          className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-colors
            ${listening ? "bg-red-400 text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          aria-label={listening ? "Stop listening" : "Voice input"}
        >
          🎤
        </motion.button>
      )}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        placeholder="Type in English..."
        className="kid-input flex-1"
        autoFocus
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSend}
        disabled={!text.trim()}
        className="big-button !w-16 !h-14 !text-2xl !px-0"
      >
        📨
      </motion.button>
    </div>
  );
}
