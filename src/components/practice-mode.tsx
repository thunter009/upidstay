"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPigLatin } from "@/lib/pig-latin";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

const WORDS = [
  "hello", "banana", "apple", "school", "friend", "happy", "funny",
  "chicken", "dragon", "elephant", "string", "question", "orange",
  "smile", "brave", "cloud", "dream", "flower", "green", "jump",
  "kitten", "laugh", "mouse", "night", "ocean", "party", "queen",
  "rainbow", "snake", "tiger", "umbrella", "violin", "water", "yellow",
];

interface PracticeModeProps {
  onBack: () => void;
  soundEnabled: boolean;
}

export function PracticeMode({ onBack, soundEnabled }: PracticeModeProps) {
  const [wordIdx, setWordIdx] = useState(() => Math.floor(Math.random() * WORDS.length));
  const [guess, setGuess] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentWord = WORDS[wordIdx];
  const correctAnswer = toPigLatin(currentWord);

  const nextWord = useCallback(() => {
    let next: number;
    do {
      next = Math.floor(Math.random() * WORDS.length);
    } while (next === wordIdx && WORDS.length > 1);
    setWordIdx(next);
    setGuess("");
    setFeedback(null);
    setShowAnswer(false);
  }, [wordIdx]);

  const handleSubmit = useCallback(() => {
    const trimmed = guess.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === correctAnswer.toLowerCase()) {
      setFeedback("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (soundEnabled) playCorrectSound();
      setTimeout(nextWord, 1200);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setShowAnswer(true);
      if (soundEnabled) playWrongSound();
    }
  }, [guess, correctAnswer, streak, bestStreak, soundEnabled, nextWord]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 p-6"
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="text-lg font-bold text-gray-500 hover:text-gray-700"
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥 {streak}</span>
            <span className="text-sm text-gray-400">Best: {bestStreak}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <h2 className="text-2xl font-black text-purple-500">Practice Mode</h2>
          <p className="text-gray-500">Translate this word to Pig Latin:</p>

          <div className="text-5xl font-black text-gray-800">{currentWord}</div>

          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Type Pig Latin here..."
            className="kid-input text-center text-xl"
            autoFocus
            disabled={feedback === "correct"}
          />

          <AnimatePresence mode="wait">
            {feedback === "correct" && (
              <motion.div
                key="correct"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-4xl"
              >
                ⭐ Correct! ⭐
              </motion.div>
            )}
            {feedback === "wrong" && (
              <motion.div
                key="wrong"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="space-y-2"
              >
                <div className="text-2xl text-red-400">Not quite!</div>
                {showAnswer && (
                  <div className="text-lg text-gray-500">
                    Answer: <span className="font-bold text-purple-500">{correctAnswer}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            {feedback === "wrong" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={nextWord}
                className="big-button flex-1 !bg-purple-400"
              >
                Next Word →
              </motion.button>
            )}
            {!feedback && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!guess.trim()}
                className="big-button flex-1"
              >
                Check!
              </motion.button>
            )}
          </div>
        </div>

        {/* Star display for streak */}
        {streak > 0 && (
          <div className="text-center text-3xl">
            {Array.from({ length: Math.min(streak, 10) }, (_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                ⭐
              </motion.span>
            ))}
            {streak > 10 && <span className="text-lg text-gray-500"> +{streak - 10}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
