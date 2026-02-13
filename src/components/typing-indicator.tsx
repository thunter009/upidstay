"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} is typing...`
      : `${usernames.join(", ")} are typing...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 py-1 text-sm text-gray-400 italic"
      >
        <span className="inline-flex items-center gap-1">
          {text}
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block"
              />
            ))}
          </span>
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
