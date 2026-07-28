import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Clipboard,
  Copy,
  Download,
  Eraser,
  RefreshCcw,
  Repeat2,
  Sparkles
} from "lucide-react";
import {
  MAX_INPUT_LENGTH,
  TransformMode,
  countGraphemes,
  getSegmenterSupport,
  isVisualMode,
  modeLabels,
  transformText
} from "./lib/textTransforms";
import {
  VISUAL_EXPORT_MAX_GRAPHEMES,
  downloadVisualPng
} from "./lib/visualExport";

type ToolAppProps = {
  defaultMode?: TransformMode;
};

const examples: Record<TransformMode, string> = {
  "reverse-characters": "Backwards text is fun!\nEmoji stay whole: cafe\u0301 👋🏽",
  "reverse-each-word": "Reverse every word, but keep this sentence order.",
  "reverse-word-order": "One small sentence can become a different order.",
  "upside-down": "Hello from 2026!",
  "upside-down-visual": "Exact 180-degree flip: Room 204!",
  mirror: "Mirror text for short playful messages.",
  "mirror-visual": "Exact mirror: Room 204!"
};

const modeHelp: Record<TransformMode, string> = {
  "reverse-characters":
    "Reverses the full text by grapheme clusters, including spaces and line breaks.",
  "reverse-each-word":
    "Reverses the letters inside each word while keeping the word order and punctuation positions.",
  "reverse-word-order":
    "Moves the words into the opposite order while keeping punctuation and spacing positions readable.",
  "upside-down":
    "Uses Unicode look-alikes for letters, then reverses order. ASCII digits stay readable because Unicode has no reliable upside-down numeral set.",
  "upside-down-visual":
    "Rotates rendered glyphs 180 degrees, so letters, digits, punctuation, and emoji flip exactly. Download PNG to keep the visual effect.",
  mirror:
    "Uses limited Unicode look-alikes to approximate mirrored text. It stays copyable, but it is not a geometrically exact reflection.",
  "mirror-visual":
    "Reflects rendered glyphs horizontally, so letters, digits, punctuation, and emoji mirror exactly. Download PNG to keep the visual effect."
};

const normalizeMode = (value: string | null): TransformMode => {
  const modes: TransformMode[] = [
    "reverse-characters",
    "reverse-each-word",
    "reverse-word-order",
    "upside-down",
    "upside-down-visual",
    "mirror",
    "mirror-visual"
  ];

  return modes.includes(value as TransformMode)
    ? (value as TransformMode)
    : "reverse-characters";
};

export const ToolApp = ({ defaultMode = "reverse-characters" }: ToolAppProps) => {
  const inputId = useId();
  const outputId = useId();
  const [mode, setMode] = useState<TransformMode>(defaultMode);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [status, setStatus] = useState(
    "Paste text to generate a backwards version."
  );
  const outputRef = useRef<HTMLTextAreaElement | null>(null);
  const visualOutputRef = useRef<HTMLDivElement | null>(null);

  const support = useMemo(() => getSegmenterSupport(), []);
  const isTooLong = input.length > MAX_INPUT_LENGTH;
  const isVisual = isVisualMode(mode);
  const inputCount = useMemo(() => countGraphemes(input), [input]);
  const outputCount = useMemo(() => countGraphemes(output), [output]);

  const runTransform = useCallback((nextInput = input, nextMode = mode) => {
    if (!nextInput) {
      setOutput("");
      setStatus("Nothing to convert yet.");
      return;
    }

    if (nextInput.length > MAX_INPUT_LENGTH) {
      setOutput("");
      setStatus(
        `Input is over the ${MAX_INPUT_LENGTH.toLocaleString()} character safety limit.`
      );
      return;
    }

    const nextOutput = transformText(nextInput, nextMode);
    setOutput(nextOutput);
    setStatus(
      isVisualMode(nextMode)
        ? `${modeLabels[nextMode]} complete. Download PNG to keep the exact geometry.`
        : `${modeLabels[nextMode]} complete. Output is ready to copy.`
    );
  }, [input, mode]);

  useEffect(() => {
    if (autoUpdate) {
      runTransform(input, mode);
    }
  }, [autoUpdate, input, mode, runTransform]);

  const handleModeChange = (nextMode: TransformMode) => {
    setMode(nextMode);

    if (autoUpdate) {
      runTransform(input, nextMode);
    }
  };

  const loadExample = () => {
    const nextInput = examples[mode];
    setInput(nextInput);
    runTransform(nextInput, mode);
  };

  const clearText = () => {
    setInput("");
    setOutput("");
    setStatus("Cleared.");
  };

  const swapOutputToInput = () => {
    if (!output) {
      setStatus("There is no output to move into the input box yet.");
      return;
    }

    setInput(output);
    setStatus("Output moved into the input box.");
  };

  const copyOutput = async () => {
    if (!output) {
      setStatus("There is no output to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setStatus(
        isVisual
          ? "Copied plain text. Clipboard text cannot retain a geometric flip; use Download PNG for the exact effect."
          : "Copied to clipboard."
      );
    } catch {
      if (isVisual) {
        setStatus(
          "Clipboard permission was unavailable. Download PNG to keep the exact visual effect."
        );
      } else {
        outputRef.current?.focus();
        outputRef.current?.select();
        setStatus("Clipboard permission was unavailable. Output is selected.");
      }
    }
  };

  const downloadPng = async () => {
    if (!output || !isVisualMode(mode)) {
      setStatus("Choose an exact visual mode and add text before downloading.");
      return;
    }

    if (outputCount > VISUAL_EXPORT_MAX_GRAPHEMES) {
      setStatus(
        `PNG export is limited to ${VISUAL_EXPORT_MAX_GRAPHEMES.toLocaleString()} graphemes. The on-screen preview still works.`
      );
      return;
    }

    const font = visualOutputRef.current
      ? window.getComputedStyle(visualOutputRef.current).font
      : '24px "SFMono-Regular", Consolas, monospace';

    try {
      await downloadVisualPng(output, mode, font);
      setStatus("PNG downloaded with the exact visual transform.");
    } catch {
      setStatus(
        "This browser could not create the PNG. Shorten text with many line breaks or use the on-screen preview."
      );
    }
  };

  return (
    <section className="tool-shell" aria-labelledby="tool-title">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">Local browser tool</p>
          <h2 id="tool-title">Paste text and convert it instantly</h2>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(event) => setAutoUpdate(event.target.checked)}
          />
          <span>Live update</span>
        </label>
      </div>

      <fieldset className="mode-picker" aria-describedby="mode-help">
        <legend>Choose a conversion mode</legend>
        {(Object.keys(modeLabels) as TransformMode[]).map((item) => (
          <label key={item} className={item === mode ? "mode active" : "mode"}>
            <input
              type="radio"
              name="transform-mode"
              value={item}
              checked={item === mode}
              onChange={() => handleModeChange(item)}
            />
            <span>{modeLabels[item]}</span>
          </label>
        ))}
      </fieldset>
      <p id="mode-help" className="mode-help">
        {modeHelp[mode]}
      </p>

      <div className="text-grid">
        <label className="text-panel" htmlFor={inputId}>
          <span className="panel-label">Input</span>
          <textarea
            id={inputId}
            data-testid="input-text"
            aria-label="Input"
            value={input}
            placeholder="Type or paste text here..."
            spellCheck="false"
            onChange={(event) => setInput(event.target.value)}
          />
          <span className={isTooLong ? "count warning" : "count"}>
            {inputCount.toLocaleString()} graphemes
          </span>
        </label>

        <div className="text-panel output-panel">
          <span id={`${outputId}-label`} className="panel-label">
            {isVisual ? "Exact visual preview" : "Output"}
          </span>
          {isVisual ? (
            <div
              id={outputId}
              ref={visualOutputRef}
              data-testid="visual-output"
              className={`visual-output ${mode}`}
              role="img"
              aria-labelledby={`${outputId}-label`}
              aria-description="The geometric transform is preserved in the downloadable PNG, not in copied plain text."
            >
              {output ? (
                <span className="visual-content" aria-hidden="true">
                  {output}
                </span>
              ) : (
                <span className="visual-placeholder">
                  Your exact visual preview will appear here.
                </span>
              )}
            </div>
          ) : (
            <textarea
              id={outputId}
              data-testid="output-text"
              aria-label="Output"
              ref={outputRef}
              value={output}
              placeholder="Your converted text will appear here."
              readOnly
              spellCheck="false"
            />
          )}
          <span className="count">{outputCount.toLocaleString()} graphemes</span>
        </div>
      </div>

      <div className="actions" aria-label="Tool actions">
        <button type="button" className="primary" onClick={() => runTransform()}>
          <RefreshCcw aria-hidden="true" />
          Convert
        </button>
        <button type="button" onClick={copyOutput}>
          <Copy aria-hidden="true" />
          {isVisual ? "Copy text" : "Copy"}
        </button>
        {isVisual && (
          <button type="button" onClick={downloadPng}>
            <Download aria-hidden="true" />
            Download PNG
          </button>
        )}
        {!isVisual && (
          <button type="button" onClick={swapOutputToInput}>
            <Repeat2 aria-hidden="true" />
            Swap
          </button>
        )}
        <button type="button" onClick={loadExample}>
          <Sparkles aria-hidden="true" />
          Example
        </button>
        <button type="button" onClick={clearText}>
          <Eraser aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="status-row" role="status" aria-live="polite">
        <Clipboard aria-hidden="true" />
        <span>{status}</span>
      </div>

      <p className="support-note">
        Grapheme support: {support.grapheme ? "Intl.Segmenter" : "fallback"}.
        Word support: {support.word ? "Intl.Segmenter" : "fallback"}. Text stays
        in this browser and is not uploaded by this site.
        {isVisual &&
          ` PNG export supports up to ${VISUAL_EXPORT_MAX_GRAPHEMES.toLocaleString()} graphemes.`}
      </p>
    </section>
  );
};

export const readDefaultModeFromDom = (): TransformMode => {
  const root = document.getElementById("tool-root");
  return normalizeMode(root?.dataset.mode ?? null);
};
