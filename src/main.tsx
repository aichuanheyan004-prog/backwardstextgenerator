import React from "react";
import { createRoot } from "react-dom/client";
import { ToolApp, readDefaultModeFromDom } from "./ToolApp";
import "./styles.css";

const rootElement = document.getElementById("tool-root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ToolApp defaultMode={readDefaultModeFromDom()} />
    </React.StrictMode>
  );
}
