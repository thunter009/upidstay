"use client";

import { motion } from "framer-motion";
import type { DifficultyLevel } from "@/lib/types";

interface DifficultyPickerProps {
  level: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}

const levels: { id: DifficultyLevel; label: string; icon: string; desc: string }[] = [
  { id: "explorer", label: "Explorer", icon: "🗺️", desc: "See both languages" },
  { id: "detective", label: "Detective", icon: "🔍", desc: "Tap to peek" },
  { id: "spy", label: "Spy", icon: "🕵️", desc: "Full Pig Latin!" },
];

export function DifficultyPicker({ level, onChange }: DifficultyPickerProps) {
  return (
    <div className="flex gap-2">
      {levels.map((l) => (
        <motion.button
          key={l.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(l.id)}
          className={`flex-1 rounded-xl py-2 px-3 text-center transition-all text-sm font-bold
            ${
              level === l.id
                ? "bg-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <div className="text-lg">{l.icon}</div>
          <div>{l.label}</div>
        </motion.button>
      ))}
    </div>
  );
}
