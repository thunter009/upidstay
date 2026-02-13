import { describe, it, expect } from "vitest";
import { slugifyRoom } from "./slugify";

describe("slugifyRoom", () => {
  it("lowercases and strips punctuation", () => {
    expect(slugifyRoom("Rainbow Party!")).toBe("rainbow-party");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugifyRoom("hello world")).toBe("hello-world");
  });

  it("trims whitespace", () => {
    expect(slugifyRoom("  spaces  ")).toBe("spaces");
  });

  it("lowercases uppercase input", () => {
    expect(slugifyRoom("UPPERCASE")).toBe("uppercase");
  });

  it("strips special characters", () => {
    expect(slugifyRoom("special@#chars!")).toBe("specialchars");
  });

  it("strips emoji", () => {
    expect(slugifyRoom("emoji 🎉 room")).toBe("emoji-room");
  });

  it("is idempotent", () => {
    expect(slugifyRoom("already-slugged")).toBe("already-slugged");
  });

  it("throws on empty input", () => {
    expect(() => slugifyRoom("")).toThrow();
  });

  it("throws on whitespace-only input", () => {
    expect(() => slugifyRoom("   ")).toThrow();
  });

  it("collapses multiple hyphens", () => {
    expect(slugifyRoom("a---b")).toBe("a-b");
  });
});
