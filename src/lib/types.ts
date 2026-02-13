export interface RoomUser {
  id: string;
  username: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  english: string;
  pigLatin: string;
  timestamp: number;
}

export type DifficultyLevel = "explorer" | "detective" | "spy";

export const AVATARS = [
  { id: "bear", emoji: "🐻", label: "Bear" },
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "bunny", emoji: "🐰", label: "Bunny" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function getAvatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? "🐻";
}
