"use client";

import { AVATARS, type AvatarId } from "@/lib/types";
import { motion } from "framer-motion";

interface AvatarPickerProps {
  selected: AvatarId;
  onSelect: (id: AvatarId) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {AVATARS.map((avatar) => (
        <motion.button
          key={avatar.id}
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(avatar.id)}
          className={`w-16 h-16 text-3xl rounded-2xl flex items-center justify-center transition-all
            ${
              selected === avatar.id
                ? "bg-pink-200 ring-4 ring-pink-400 shadow-lg"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          aria-label={avatar.label}
        >
          {avatar.emoji}
        </motion.button>
      ))}
    </div>
  );
}
