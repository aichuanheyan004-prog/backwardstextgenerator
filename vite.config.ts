import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  appType: "mpa",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fromRoot("./index.html"),
        guide: fromRoot("./guide/index.html"),
        upsideDown: fromRoot("./upside-down-text/index.html"),
        privacy: fromRoot("./privacy/index.html"),
        terms: fromRoot("./terms/index.html"),
        notFound: fromRoot("./404.html")
      }
    }
  }
});
