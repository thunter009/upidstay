"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSocket } from "@/lib/socket-context";
import { getAvatarEmoji, type DifficultyLevel } from "@/lib/types";
import { playReceiveSound, playJoinSound } from "@/lib/sounds";
import { shareRoom } from "@/lib/share";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { DifficultyPicker } from "./difficulty-picker";

interface ChatRoomProps {
  username: string;
  onLeave: () => void;
}

export function ChatRoom({ username, onLeave }: ChatRoomProps) {
  const { room, users, messages, typingUsers, sendMessage, sendTyping, leaveRoom } = useSocket();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("explorer");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRead, setAutoRead] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sound effects for new messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const latest = messages[messages.length - 1];
      if (latest.username !== "" && latest.username !== username && soundEnabled) {
        playReceiveSound();
      }
      // Auto-read incoming messages
      if (autoRead && latest.username !== username && latest.username !== "") {
        import("@/lib/speech").then(({ speak }) => speak(latest.pigLatin));
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, username, soundEnabled, autoRead]);

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  const handleInvite = async () => {
    if (!room) return;
    await shareRoom(room);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2000);
  };

  const filteredTyping = typingUsers.filter((u) => u !== username);

  return (
    <div className="relative flex flex-col h-dvh bg-gradient-to-b from-sky-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLeave}
          className="text-lg font-bold text-gray-400 hover:text-gray-600"
        >
          ← Leave
        </motion.button>
        <div className="text-center">
          <div className="text-xl font-black text-sky-500">{room}</div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            {users.map((u) => (
              <span key={u.id} title={u.username}>
                {getAvatarEmoji(u.avatar)}
              </span>
            ))}
            <span>· {users.length} online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleInvite}
            className="text-xl p-2"
            aria-label="Invite"
          >
            🔗
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xl p-2"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Copied toast */}
      {showCopiedToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50"
        >
          Link copied!
        </motion.div>
      )}

      {/* Settings drawer */}
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-white border-b px-4 py-3 space-y-3"
        >
          <DifficultyPicker level={difficulty} onChange={setDifficulty} />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 accent-pink-500"
              />
              <span>Sound effects</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => setAutoRead(e.target.checked)}
                className="w-5 h-5 accent-pink-500"
              />
              <span>Auto-read messages</span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 mt-12">
            <div className="text-5xl mb-2">💬</div>
            <div className="text-lg">Say something!</div>
            <div className="text-sm">Type in English — others see Pig Latin</div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.username === username}
            difficulty={difficulty}
          />
        ))}
        <TypingIndicator usernames={filteredTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} onTyping={sendTyping} soundEnabled={soundEnabled} />
    </div>
  );
}
