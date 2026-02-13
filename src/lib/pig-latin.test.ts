import { describe, it, expect } from "vitest";
import { toPigLatin, getConsonantCluster } from "./pig-latin";

describe("toPigLatin", () => {
  it("translates consonant-start words", () => {
    expect(toPigLatin("stupid")).toBe("upidstay");
    expect(toPigLatin("pig")).toBe("igpay");
    expect(toPigLatin("latin")).toBe("atinlay");
    expect(toPigLatin("banana")).toBe("ananabay");
    expect(toPigLatin("hello")).toBe("ellohay");
  });

  it("handles consonant clusters", () => {
    expect(toPigLatin("chrome")).toBe("omechray");
    expect(toPigLatin("string")).toBe("ingstray");
    expect(toPigLatin("glove")).toBe("oveglay");
    expect(toPigLatin("school")).toBe("oolschay");
    expect(toPigLatin("three")).toBe("eethray");
  });

  it("translates vowel-start words", () => {
    expect(toPigLatin("apple")).toBe("appleway");
    expect(toPigLatin("egg")).toBe("eggway");
    expect(toPigLatin("under")).toBe("underway");
    expect(toPigLatin("ice")).toBe("iceway");
    expect(toPigLatin("orange")).toBe("orangeway");
  });

  it("handles qu as a unit", () => {
    expect(toPigLatin("question")).toBe("estionquay");
    expect(toPigLatin("queen")).toBe("eenquay");
    expect(toPigLatin("squid")).toBe("idsquay");
    expect(toPigLatin("squirrel")).toBe("irrelsquay");
  });

  it("preserves capitalization", () => {
    expect(toPigLatin("Hello")).toBe("Ellohay");
    expect(toPigLatin("Apple")).toBe("Appleway");
    expect(toPigLatin("HELLO")).toBe("ELLOHAY");
    expect(toPigLatin("Chrome")).toBe("Omechray");
  });

  it("preserves punctuation", () => {
    expect(toPigLatin("hello!")).toBe("ellohay!");
    expect(toPigLatin("hello.")).toBe("ellohay.");
    expect(toPigLatin('"hello"')).toBe('"ellohay"');
    expect(toPigLatin("can't")).toBe("an'tcay");
  });

  it("handles full sentences", () => {
    expect(toPigLatin("I love pig latin")).toBe("Iway ovelay igpay atinlay");
    expect(toPigLatin("Hello world!")).toBe("Ellohay orldway!");
  });

  it("handles empty/whitespace", () => {
    expect(toPigLatin("")).toBe("");
    expect(toPigLatin("   ")).toBe("   ");
  });

  it("handles the app name", () => {
    expect(toPigLatin("stupid")).toBe("upidstay");
  });
});

describe("getConsonantCluster", () => {
  it("returns cluster for consonant-start words", () => {
    expect(getConsonantCluster("string")).toEqual({ cluster: "str", rest: "ing" });
    expect(getConsonantCluster("chrome")).toEqual({ cluster: "chr", rest: "ome" });
  });

  it("returns null for vowel-start words", () => {
    expect(getConsonantCluster("apple")).toBeNull();
    expect(getConsonantCluster("orange")).toBeNull();
  });

  it("handles qu", () => {
    expect(getConsonantCluster("question")).toEqual({ cluster: "qu", rest: "estion" });
    expect(getConsonantCluster("squirrel")).toEqual({ cluster: "squ", rest: "irrel" });
  });
});
