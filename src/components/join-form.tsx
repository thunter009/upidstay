"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AvatarPicker } from "./avatar-picker";
import type { AvatarId } from "@/lib/types";
import { getAvatarEmoji } from "@/lib/types";
import type { ActiveRoom } from "@/lib/socket-context";
import {
  getProfiles,
  getActiveProfile,
  saveProfile,
  setActiveProfile,
  deleteProfile,
  type UserProfile,
} from "@/lib/profiles";

interface JoinFormProps {
  onJoin: (username: string, room: string, avatar: AvatarId) => void;
  initialRoom?: string;
  roomLocked?: boolean;
  activeRooms?: ActiveRoom[];
}

export function JoinForm({ onJoin, initialRoom = "", roomLocked = false, activeRooms = [] }: JoinFormProps) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(initialRoom);
  const [avatar, setAvatar] = useState<AvatarId>("bear");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    const saved = getActiveProfile();
    if (saved) {
      setUsername(saved.username);
      setAvatar(saved.avatar);
    }
    setProfiles(getProfiles());
    setLoaded(true);
  }, []);

  const handleJoin = () => {
    if (!canSubmit) return;
    const trimmedName = username.trim();
    const trimmedRoom = room.trim();
    saveProfile(trimmedName, avatar);
    setProfiles(getProfiles());
    onJoin(trimmedName, trimmedRoom, avatar);
  };

  const handleSwitchProfile = (profile: UserProfile) => {
    setActiveProfile(profile.id);
    setUsername(profile.username);
    setAvatar(profile.avatar);
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProfile(id);
    const updated = getProfiles();
    setProfiles(updated);
  };

  const canSubmit = username.trim().length > 0 && room.trim().length > 0;
  const otherProfiles = profiles.filter(
    (p) => p.username.toLowerCase() !== username.toLowerCase()
  );

  if (!loaded) return null;

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

        {/* Profile switcher */}
        {otherProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1.5">Switch profile</label>
            <div className="flex flex-wrap gap-2">
              {otherProfiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSwitchProfile(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-purple-100 text-sm font-bold text-gray-600 hover:text-purple-600 transition-all group"
                >
                  <span>{getAvatarEmoji(p.avatar)}</span>
                  <span>{p.username}</span>
                  <span
                    onClick={(e) => handleDeleteProfile(e, p.id)}
                    className="ml-1 text-gray-300 hover:text-red-400 text-xs"
                    title="Remove profile"
                  >
                    ✕
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
              autoFocus={!username}
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
              autoFocus={!!username}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
            />
            {!roomLocked && activeRooms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {activeRooms.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => setRoom(r.name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                      room === r.name
                        ? "bg-purple-500 text-white"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    {r.name} ({r.count} {r.count === 1 ? "person" : "people"})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">Pick Your Animal</label>
            <AvatarPicker selected={avatar} onSelect={setAvatar} />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleJoin}
          disabled={!canSubmit}
          className="big-button w-full"
        >
          Join Room!
        </motion.button>
      </div>
    </motion.div>
  );
}
