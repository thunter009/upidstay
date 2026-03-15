"use client";

import type { AvatarId } from "./types";

export interface UserProfile {
  id: string;
  username: string;
  avatar: AvatarId;
}

const STORAGE_KEY = "upidstay-profiles";
const ACTIVE_KEY = "upidstay-active-profile";

function readProfiles(): UserProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getProfiles(): UserProfile[] {
  return readProfiles();
}

export function getActiveProfile(): UserProfile | null {
  const profiles = readProfiles();
  if (!profiles.length) return null;
  const activeId = localStorage.getItem(ACTIVE_KEY);
  return profiles.find((p) => p.id === activeId) ?? profiles[0];
}

export function saveProfile(username: string, avatar: AvatarId): UserProfile {
  const profiles = readProfiles();
  const existing = profiles.find((p) => p.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    existing.username = username;
    existing.avatar = avatar;
    writeProfiles(profiles);
    localStorage.setItem(ACTIVE_KEY, existing.id);
    return existing;
  }
  const profile: UserProfile = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username,
    avatar,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  localStorage.setItem(ACTIVE_KEY, profile.id);
  return profile;
}

export function setActiveProfile(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function deleteProfile(id: string) {
  const profiles = readProfiles().filter((p) => p.id !== id);
  writeProfiles(profiles);
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (activeId === id) {
    localStorage.setItem(ACTIVE_KEY, profiles[0]?.id ?? "");
  }
}
