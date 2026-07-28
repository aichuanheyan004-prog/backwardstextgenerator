export const MAX_INPUT_LENGTH = 200_000;

export type TransformMode =
  | "reverse-characters"
  | "reverse-each-word"
  | "reverse-word-order"
  | "upside-down"
  | "upside-down-visual"
  | "mirror"
  | "mirror-visual";

export type VisualTransformMode = "upside-down-visual" | "mirror-visual";

export type SegmenterSupport = {
  grapheme: boolean;
  word: boolean;
};

export const modeLabels: Record<TransformMode, string> = {
  "reverse-characters": "Reverse characters",
  "reverse-each-word": "Reverse each word",
  "reverse-word-order": "Reverse word order",
  "upside-down": "Upside-down Unicode",
  "upside-down-visual": "Exact upside-down preview",
  mirror: "Mirror Unicode (approx.)",
  "mirror-visual": "Exact mirror preview"
};

export const isVisualMode = (mode: TransformMode): mode is VisualTransformMode =>
  mode === "upside-down-visual" || mode === "mirror-visual";

type SegmentPart = {
  value: string;
  isWordLike: boolean;
};

const getIntlSegmenter = (granularity: "grapheme" | "word") => {
  const Segmenter = Intl?.Segmenter;

  if (typeof Segmenter !== "function") {
    return undefined;
  }

  return new Segmenter(undefined, { granularity });
};

export const getSegmenterSupport = (): SegmenterSupport => ({
  grapheme: Boolean(getIntlSegmenter("grapheme")),
  word: Boolean(getIntlSegmenter("word"))
});

export const segmentGraphemes = (text: string): string[] => {
  const segmenter = getIntlSegmenter("grapheme");

  if (!segmenter) {
    return Array.from(text);
  }

  return Array.from(segmenter.segment(text), (part) => part.segment);
};

const fallbackWordParts = (text: string): SegmentPart[] => {
  const matcher = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu;
  const parts: SegmentPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(matcher)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > cursor) {
      parts.push({ value: text.slice(cursor, index), isWordLike: false });
    }

    parts.push({ value, isWordLike: true });
    cursor = index + value.length;
  }

  if (cursor < text.length) {
    parts.push({ value: text.slice(cursor), isWordLike: false });
  }

  return parts;
};

export const segmentWords = (text: string): SegmentPart[] => {
  const segmenter = getIntlSegmenter("word");

  if (!segmenter) {
    return fallbackWordParts(text);
  }

  return Array.from(segmenter.segment(text), (part) => ({
    value: part.segment,
    isWordLike: Boolean(part.isWordLike)
  }));
};

export const reverseCharacters = (text: string): string =>
  segmentGraphemes(text).reverse().join("");

export const reverseEachWord = (text: string): string =>
  segmentWords(text)
    .map((part) => (part.isWordLike ? reverseCharacters(part.value) : part.value))
    .join("");

export const reverseWordOrder = (text: string): string => {
  const parts = segmentWords(text);
  const reversedWords = parts
    .filter((part) => part.isWordLike)
    .map((part) => part.value)
    .reverse();
  let wordIndex = 0;

  return parts
    .map((part) => {
      if (!part.isWordLike) {
        return part.value;
      }

      const replacement = reversedWords[wordIndex] ?? "";
      wordIndex += 1;
      return replacement;
    })
    .join("");
};

const upsideDownMap: Record<string, string> = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ᴉ",
  j: "ɾ",
  k: "ʞ",
  l: "l",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  A: "∀",
  B: "ꓭ",
  C: "Ɔ",
  D: "ᗡ",
  E: "Ǝ",
  F: "Ⅎ",
  G: "פ",
  H: "H",
  I: "I",
  J: "ſ",
  K: "ꓘ",
  L: "⅂",
  M: "W",
  N: "N",
  O: "O",
  P: "Ԁ",
  Q: "Ό",
  R: "ᴚ",
  S: "S",
  T: "⊥",
  U: "∩",
  V: "Λ",
  W: "M",
  X: "X",
  Y: "⅄",
  Z: "Z",
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  ".": "˙",
  ",": "'",
  "'": ",",
  "\"": "„",
  "`": ",",
  "?": "¿",
  "!": "¡",
  "[": "]",
  "]": "[",
  "(": ")",
  ")": "(",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "&": "⅋",
  "_": "‾"
};

const mirrorMap: Record<string, string> = {
  a: "ɒ",
  b: "d",
  c: "ɔ",
  d: "b",
  e: "ɘ",
  f: "ꟻ",
  g: "ǫ",
  h: "ʜ",
  i: "i",
  j: "ꞁ",
  k: "ʞ",
  l: "l",
  m: "m",
  n: "ᴎ",
  o: "o",
  p: "q",
  q: "p",
  r: "ɿ",
  s: "ꙅ",
  t: "ƚ",
  u: "u",
  v: "v",
  w: "w",
  x: "x",
  y: "ʏ",
  z: "ƹ",
  A: "A",
  B: "ᗺ",
  C: "Ɔ",
  D: "ᗡ",
  E: "Ǝ",
  F: "ꟻ",
  G: "Ꭾ",
  H: "H",
  I: "I",
  J: "Ⴑ",
  K: "ꓘ",
  L: "⅃",
  M: "M",
  N: "И",
  O: "O",
  P: "ꟼ",
  Q: "Ọ",
  R: "Я",
  S: "Ꙅ",
  T: "T",
  U: "U",
  V: "V",
  W: "W",
  X: "X",
  Y: "Y",
  Z: "Ƹ",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "/": "\\",
  "\\": "/"
};

const mapWithFallback = (value: string, table: Record<string, string>) =>
  table[value] ?? value;

export const upsideDownText = (text: string): string =>
  segmentGraphemes(text)
    .reverse()
    .map((part) => mapWithFallback(part, upsideDownMap))
    .join("");

export const mirrorText = (text: string): string =>
  segmentGraphemes(text)
    .reverse()
    .map((part) => mapWithFallback(part, mirrorMap))
    .join("");

export const transformText = (text: string, mode: TransformMode): string => {
  switch (mode) {
    case "reverse-characters":
      return reverseCharacters(text);
    case "reverse-each-word":
      return reverseEachWord(text);
    case "reverse-word-order":
      return reverseWordOrder(text);
    case "upside-down":
      return upsideDownText(text);
    case "upside-down-visual":
      return text;
    case "mirror":
      return mirrorText(text);
    case "mirror-visual":
      return text;
  }
};

export const countGraphemes = (text: string): number =>
  segmentGraphemes(text).length;
