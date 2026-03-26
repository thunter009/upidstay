"use client";

import { AVATARS, type AvatarId } from "@/lib/types";
import { motion } from "framer-motion";

interface AvatarPickerProps {
  selected: AvatarId;
  onSelect: (id: AvatarId) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  animals: "Animals",
  mythical: "Mythical",
  food: "Food",
  space: "Space",
  fun: "Fun",
};

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  const categories = [...new Set(AVATARS.map((a) => a.category))];

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.filter((a) => a.category === category).map((avatar) => (
              <motion.button
                key={avatar.id}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelect(avatar.id)}
                className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all
                  ${
                    selected === avatar.id
                      ? "bg-pink-200 ring-3 ring-pink-400 shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                aria-label={avatar.label}
              >
                {avatar.emoji}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
