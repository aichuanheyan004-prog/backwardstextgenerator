import { describe, expect, it } from "vitest";
import {
  countGraphemes,
  isVisualMode,
  mirrorText,
  reverseCharacters,
  reverseEachWord,
  reverseWordOrder,
  transformText,
  upsideDownText
} from "../src/lib/textTransforms";

describe("text transform logic", () => {
  it("reverses by grapheme clusters without breaking emoji or combining marks", () => {
    const input = "a🇺🇸👨‍👩‍👧‍👦e\u0301";

    expect(reverseCharacters(input)).toBe("e\u0301👨‍👩‍👧‍👦🇺🇸a");
    expect(countGraphemes(input)).toBe(4);
  });

  it("keeps newlines in the reversed character output", () => {
    expect(reverseCharacters("Line 1\nLine 2")).toBe("2 eniL\n1 eniL");
  });

  it("reverses letters inside words while leaving emoji and punctuation positions alone", () => {
    expect(reverseEachWord("Hello 👋🏽 world!")).toBe("olleH 👋🏽 dlrow!");
  });

  it("reverses word order without converting punctuation into words", () => {
    expect(reverseWordOrder("One, two three!")).toBe("three, two One!");
  });

  it("handles empty input", () => {
    expect(transformText("", "reverse-characters")).toBe("");
    expect(transformText("", "reverse-each-word")).toBe("");
    expect(transformText("", "reverse-word-order")).toBe("");
  });

  it("handles long input without changing the grapheme count", () => {
    const input = "abc ".repeat(20_000);
    const output = reverseCharacters(input);

    expect(output.length).toBe(input.length);
    expect(output.startsWith(" cba")).toBe(true);
  });

  it("creates upside-down Unicode for mapped characters and leaves spaces intact", () => {
    expect(upsideDownText("hello 123!")).toBe("¡321 ollǝɥ");
  });

  it("keeps every ASCII digit readable while reversing their order", () => {
    expect(upsideDownText("0123456789")).toBe("9876543210");
  });

  it("creates limited mirror text for mapped characters", () => {
    expect(mirrorText("bad")).toBe("bɒd");
  });

  it("keeps source text intact for exact geometric preview modes", () => {
    expect(transformText("Room 204!", "upside-down-visual")).toBe("Room 204!");
    expect(transformText("Room 204!", "mirror-visual")).toBe("Room 204!");
    expect(isVisualMode("upside-down-visual")).toBe(true);
    expect(isVisualMode("mirror-visual")).toBe(true);
    expect(isVisualMode("mirror")).toBe(false);
  });
});
