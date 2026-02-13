export function slugifyRoom(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Room name cannot be empty");

  return trimmed
    .toLowerCase()
    .replace(/[\u{10000}-\u{10FFFF}]/gu, "") // strip emoji (surrogate pairs / U+10000+)
    .replace(/[\uD800-\uDFFF]/g, "") // strip lone surrogates
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/[^a-z0-9-]/g, "") // strip non-alphanumeric (except hyphens)
    .replace(/-{2,}/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}
