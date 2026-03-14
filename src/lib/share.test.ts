import { describe, it, expect, vi, beforeEach } from "vitest";
import { shareRoom } from "./share";

describe("shareRoom", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default: no native share, clipboard available
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "https://example.com" } },
      writable: true,
      configurable: true,
    });
  });

  it("uses navigator.share when available", async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareFn,
      writable: true,
      configurable: true,
    });

    await shareRoom("test-room");

    expect(shareFn).toHaveBeenCalledWith({
      title: "Join my Pig Latin room!",
      url: "https://example.com/join/test-room",
    });
  });

  it("falls back to clipboard.writeText when navigator.share is absent", async () => {
    await shareRoom("test-room");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://example.com/join/test-room"
    );
  });

  it("generates correct URL format with slugified room name", async () => {
    await shareRoom("My Cool Room!");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://example.com/join/my-cool-room"
    );
  });
});
