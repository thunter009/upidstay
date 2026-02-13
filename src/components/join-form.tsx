"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AvatarPicker } from "./avatar-picker";
import type { AvatarId } from "@/lib/types";

interface JoinFormProps {
  onJoin: (username: string, room: string, avatar: AvatarId) => void;
  initialRoom?: string;
  roomLocked?: boolean;
}

export function JoinForm({ onJoin, initialRoom = "", roomLocked = false }: JoinFormProps) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(initialRoom);
  const [avatar, setAvatar] = useState<AvatarId>("bear");

  const canSubmit = username.trim().length > 0 && room.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-5xl font-black text-pink-500 tracking-tight">Upidstay</h1>
          <p className="text-xl text-gray-500 mt-1">Ig-Pay Atin-Lay Alkie-Talkieway!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="What's your name?"
              maxLength={20}
              className="kid-input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              value={room}
              onChange={(e) => !roomLocked && setRoom(e.target.value)}
              placeholder="Pick a room name"
              maxLength={30}
              className="kid-input"
              disabled={roomLocked}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) onJoin(username.trim(), room.trim(), avatar);
              }}
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">Pick Your Animal</label>
            <AvatarPicker selected={avatar} onSelect={setAvatar} />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => canSubmit && onJoin(username.trim(), room.trim(), avatar)}
          disabled={!canSubmit}
          className="big-button w-full"
        >
          Join Room!
        </motion.button>
      </div>
    </motion.div>
  );
}
