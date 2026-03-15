"use client";

import { useState, useCallback } from "react";
import { SocketProvider, useSocket } from "@/lib/socket-context";
import { JoinForm } from "@/components/join-form";
import { ChatRoom } from "@/components/chat-room";
import { PracticeMode } from "@/components/practice-mode";
import type { AvatarId } from "@/lib/types";
import { playJoinSound } from "@/lib/sounds";
import { motion } from "framer-motion";

type View = "home" | "chat" | "practice";

function AppContent() {
  const [view, setView] = useState<View>("home");
  const [username, setUsername] = useState("");
  const { joinRoom, connected, activeRooms } = useSocket();

  const handleJoin = useCallback(
    (name: string, room: string, avatar: AvatarId) => {
      setUsername(name);
      joinRoom(room, name, avatar);
      playJoinSound();
      setView("chat");
    },
    [joinRoom]
  );

  if (view === "practice") {
    return <PracticeMode onBack={() => setView("home")} soundEnabled={true} />;
  }

  if (view === "chat") {
    return <ChatRoom username={username} onLeave={() => setView("home")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-sky-50 flex flex-col items-center justify-center p-6">
      <JoinForm onJoin={handleJoin} activeRooms={activeRooms} />
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setView("practice")}
        className="mt-6 text-lg font-bold text-purple-400 hover:text-purple-600 transition-colors"
      >
        Practice Mode (solo)
      </motion.button>
      {!connected && (
        <div className="mt-4 text-sm text-red-400">Connecting to server...</div>
      )}
      <div className="mt-4 text-xs text-gray-300">v0.2.0</div>
    </div>
  );
}

export default function Home() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
