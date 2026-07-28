import { VisualTransformMode, segmentGraphemes } from "./textTransforms";

const EXPORT_MAX_WIDTH = 1200;
const EXPORT_MIN_WIDTH = 480;
const EXPORT_PADDING = 32;
const EXPORT_LINE_HEIGHT = 36;
const EXPORT_PIXEL_RATIO = 2;
export const VISUAL_EXPORT_MAX_GRAPHEMES = 10_000;
const VISUAL_EXPORT_MAX_LINES = 400;

const wrapLine = (
  context: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string[] => {
  if (!line) {
    return [""];
  }

  const wrapped: string[] = [];
  let current = "";

  for (const grapheme of segmentGraphemes(line)) {
    const candidate = current + grapheme;

    if (current && context.measureText(candidate).width > maxWidth) {
      wrapped.push(current);
      current = grapheme;
    } else {
      current = candidate;
    }
  }

  wrapped.push(current);
  return wrapped;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadVisualPng = async (
  text: string,
  mode: VisualTransformMode,
  font: string
): Promise<void> => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  if (segmentGraphemes(text).length > VISUAL_EXPORT_MAX_GRAPHEMES) {
    throw new Error("The text is over the PNG export limit.");
  }

  context.font = font;
  const maxTextWidth = EXPORT_MAX_WIDTH - EXPORT_PADDING * 2;
  const lines = text
    .split("\n")
    .flatMap((line) => wrapLine(context, line, maxTextWidth));

  if (lines.length > VISUAL_EXPORT_MAX_LINES) {
    throw new Error("The text creates too many PNG lines.");
  }
  const measuredWidth = Math.max(
    0,
    ...lines.map((line) => context.measureText(line).width)
  );
  const width = Math.min(
    EXPORT_MAX_WIDTH,
    Math.max(EXPORT_MIN_WIDTH, Math.ceil(measuredWidth + EXPORT_PADDING * 2))
  );
  const height = Math.max(
    180,
    Math.ceil(lines.length * EXPORT_LINE_HEIGHT + EXPORT_PADDING * 2)
  );

  canvas.width = width * EXPORT_PIXEL_RATIO;
  canvas.height = height * EXPORT_PIXEL_RATIO;

  context.save();
  context.scale(EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIO);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  if (mode === "mirror-visual") {
    context.translate(width, 0);
    context.scale(-1, 1);
  } else {
    context.translate(width, height);
    context.rotate(Math.PI);
  }

  context.font = font;
  context.fillStyle = "#19201f";
  context.textBaseline = "top";
  lines.forEach((line, index) => {
    context.fillText(
      line,
      EXPORT_PADDING,
      EXPORT_PADDING + index * EXPORT_LINE_HEIGHT
    );
  });
  context.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("The PNG could not be created."));
      }
    }, "image/png");
  });

  triggerDownload(
    blob,
    mode === "mirror-visual"
      ? "exact-mirror-text.png"
      : "exact-upside-down-text.png"
  );
};
