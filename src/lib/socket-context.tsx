"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, RoomUser } from "./types";

export interface ActiveRoom {
  name: string;
  count: number;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  room: string | null;
  users: RoomUser[];
  messages: ChatMessage[];
  typingUsers: string[];
  activeRooms: ActiveRoom[];
  joinRoom: (room: string, username: string, avatar: string) => void;
  leaveRoom: () => void;
  sendMessage: (english: string, pigLatin: string) => void;
  sendTyping: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const s = io({ autoConnect: true });
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("room-list", (list: ActiveRoom[]) => setActiveRooms(list));

    s.on("room-users", (roomUsers: RoomUser[]) => {
      setUsers(roomUsers);
    });

    s.on("message-history", (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });

    s.on("new-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    s.on("user-joined", (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          username: "",
          avatar: "",
          english: `${data.username} joined!`,
          pigLatin: `${data.username} oinedjay!`,
          timestamp: Date.now(),
        },
      ]);
    });

    s.on("user-left", (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          username: "",
          avatar: "",
          english: `${data.username} left`,
          pigLatin: `${data.username} eftlay`,
          timestamp: Date.now(),
        },
      ]);
    });

    s.on("user-typing", (data: { username: string }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(data.username)) return [...prev, data.username];
        return prev;
      });

      // Clear after 2s
      const existing = typingTimeouts.current.get(data.username);
      if (existing) clearTimeout(existing);
      typingTimeouts.current.set(
        data.username,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username));
          typingTimeouts.current.delete(data.username);
        }, 2000)
      );
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const joinRoom = useCallback(
    (roomName: string, username: string, avatar: string) => {
      if (!socket) return;
      setMessages([]);
      setRoom(roomName);
      socket.emit("join-room", { room: roomName, username, avatar });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("leave-room");
    setRoom(null);
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
  }, [socket]);

  const sendMessage = useCallback(
    (english: string, pigLatin: string) => {
      if (!socket) return;
      socket.emit("send-message", { english, pigLatin });
    },
    [socket]
  );

  const sendTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("typing");
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        room,
        users,
        messages,
        typingUsers,
        activeRooms,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
