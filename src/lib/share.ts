import { slugifyRoom } from "./slugify";

export async function shareRoom(roomSlug: string): Promise<void> {
  const url = `${window.location.origin}/join/${slugifyRoom(roomSlug)}`;

  if (navigator.share) {
    await navigator.share({
      title: "Join my Pig Latin room!",
      url,
    });
  } else {
    await navigator.clipboard.writeText(url);
  }
}
