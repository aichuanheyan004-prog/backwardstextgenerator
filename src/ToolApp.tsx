import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Clipboard,
  Copy,
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
  modeLabels,
  transformText
} from "./lib/textTransforms";

type ToolAppProps = {
  defaultMode?: TransformMode;
};

const examples: Record<TransformMode, string> = {
  "reverse-characters": "Backwards text is fun!\nEmoji stay whole: cafe\u0301 👋🏽",
  "reverse-each-word": "Reverse every word, but keep this sentence order.",
  "reverse-word-order": "One small sentence can become a different order.",
  "upside-down": "Hello from 2026!",
  mirror: "Mirror text for short playful messages."
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
  mirror:
    "Uses limited Unicode look-alikes to approximate mirrored text. Unsupported characters stay unchanged."
};

const normalizeMode = (value: string | null): TransformMode => {
  const modes: TransformMode[] = [
    "reverse-characters",
    "reverse-each-word",
    "reverse-word-order",
    "upside-down",
    "mirror"
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

  const support = useMemo(() => getSegmenterSupport(), []);
  const isTooLong = input.length > MAX_INPUT_LENGTH;
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
    setStatus(`${modeLabels[nextMode]} complete. Output is ready to copy.`);
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
      setStatus("Copied to clipboard.");
    } catch {
      outputRef.current?.focus();
      outputRef.current?.select();
      setStatus("Clipboard permission was unavailable. Output is selected.");
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

        <label className="text-panel output-panel" htmlFor={outputId}>
          <span className="panel-label">Output</span>
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
          <span className="count">{outputCount.toLocaleString()} graphemes</span>
        </label>
      </div>

      <div className="actions" aria-label="Tool actions">
        <button type="button" className="primary" onClick={() => runTransform()}>
          <RefreshCcw aria-hidden="true" />
          Convert
        </button>
        <button type="button" onClick={copyOutput}>
          <Copy aria-hidden="true" />
          Copy
        </button>
        <button type="button" onClick={swapOutputToInput}>
          <Repeat2 aria-hidden="true" />
          Swap
        </button>
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
      </p>
    </section>
  );
};

export const readDefaultModeFromDom = (): TransformMode => {
  const root = document.getElementById("tool-root");
  return normalizeMode(root?.dataset.mode ?? null);
};
