"use client";

import { use, useState, useCallback } from "react";
import { SocketProvider, useSocket } from "@/lib/socket-context";
import { JoinForm } from "@/components/join-form";
import { ChatRoom } from "@/components/chat-room";
import { slugifyRoom } from "@/lib/slugify";
import type { AvatarId } from "@/lib/types";
import { playJoinSound } from "@/lib/sounds";

function JoinRoomContent({ room }: { room: string }) {
  const [inChat, setInChat] = useState(false);
  const [username, setUsername] = useState("");
  const { joinRoom, connected } = useSocket();

  const slug = slugifyRoom(decodeURIComponent(room));

  const handleJoin = useCallback(
    (name: string, roomName: string, avatar: AvatarId) => {
      setUsername(name);
      joinRoom(roomName, name, avatar);
      playJoinSound();
      setInChat(true);
    },
    [joinRoom]
  );

  if (inChat) {
    return <ChatRoom username={username} onLeave={() => setInChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-sky-50 flex flex-col items-center justify-center p-6">
      <JoinForm onJoin={handleJoin} initialRoom={slug} roomLocked />
      {!connected && (
        <div className="mt-4 text-sm text-red-400">Connecting to server...</div>
      )}
    </div>
  );
}

export default function JoinRoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = use(params);
  return (
    <SocketProvider>
      <JoinRoomContent room={room} />
    </SocketProvider>
  );
}
