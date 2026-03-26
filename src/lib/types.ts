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
  // Original 6 — IDs must not change (backward compat)
  { id: "bear", emoji: "🐻", label: "Bear", category: "animals" },
  { id: "cat", emoji: "🐱", label: "Cat", category: "animals" },
  { id: "dog", emoji: "🐶", label: "Dog", category: "animals" },
  { id: "fox", emoji: "🦊", label: "Fox", category: "animals" },
  { id: "owl", emoji: "🦉", label: "Owl", category: "animals" },
  { id: "bunny", emoji: "🐰", label: "Bunny", category: "animals" },
  // More animals
  { id: "panda", emoji: "🐼", label: "Panda", category: "animals" },
  { id: "koala", emoji: "🐨", label: "Koala", category: "animals" },
  { id: "frog", emoji: "🐸", label: "Frog", category: "animals" },
  { id: "octopus", emoji: "🐙", label: "Octopus", category: "animals" },
  // Mythical
  { id: "dragon", emoji: "🐉", label: "Dragon", category: "mythical" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", category: "mythical" },
  { id: "alien", emoji: "👽", label: "Alien", category: "mythical" },
  { id: "ghost", emoji: "👻", label: "Ghost", category: "mythical" },
  // Food
  { id: "pizza", emoji: "🍕", label: "Pizza", category: "food" },
  { id: "taco", emoji: "🌮", label: "Taco", category: "food" },
  { id: "cupcake", emoji: "🧁", label: "Cupcake", category: "food" },
  { id: "avocado", emoji: "🥑", label: "Avocado", category: "food" },
  // Space
  { id: "rocket", emoji: "🚀", label: "Rocket", category: "space" },
  { id: "star", emoji: "⭐", label: "Star", category: "space" },
  { id: "moon", emoji: "🌙", label: "Moon", category: "space" },
  { id: "saturn", emoji: "🪐", label: "Saturn", category: "space" },
  // Fun
  { id: "robot", emoji: "🤖", label: "Robot", category: "fun" },
  { id: "ninja", emoji: "🥷", label: "Ninja", category: "fun" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function getAvatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? "🐻";
}
