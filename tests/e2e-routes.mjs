import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const isWindows = process.platform === "win32";
const previewCommand = isWindows ? "cmd.exe" : "npm";
const previewArgs = isWindows
  ? ["/d", "/s", "/c", "npm.cmd run preview -- --port 4173"]
  : ["run", "preview", "--", "--port", "4173"];
const baseUrl = "http://127.0.0.1:4173";

if (!existsSync("dist/index.html")) {
  throw new Error("dist/index.html is missing. Run npm run build before test:e2e.");
}

const server = spawn(
  previewCommand,
  previewArgs,
  {
    stdio: "ignore",
    env: { ...process.env, BROWSER: "none" }
  }
);

const waitForServer = async () => {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error("Preview server did not become ready.");
};

const assertPage = async (path, expectedTitle, canonical) => {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== 200) {
    throw new Error(`${path} returned ${response.status}, expected 200.`);
  }

  const html = await response.text();
  if (!html.includes(`<title>${expectedTitle}</title>`)) {
    throw new Error(`${path} title mismatch.`);
  }
  const canonicalPattern = new RegExp(
    `<link[^>]+rel=["']canonical["'][^>]+href=["']${canonical.replaceAll("/", "\\/")}["']`,
    "s"
  );
  if (!canonicalPattern.test(html)) {
    throw new Error(`${path} canonical mismatch.`);
  }
  if (!html.includes('property="og:image"')) {
    throw new Error(`${path} missing og:image.`);
  }
};

try {
  await waitForServer();
  await assertPage("/", "Backwards Text Generator - Reverse Text Online", "https://www.backwardstextgenerator.net/");
  await assertPage("/guide/", "How to Reverse Text, Words, and Word Order", "https://www.backwardstextgenerator.net/guide/");
  await assertPage("/upside-down-text/", "Upside Down Text Generator - Copy and Paste Flip Text", "https://www.backwardstextgenerator.net/upside-down-text/");
  await assertPage("/privacy/", "Privacy Policy - Backwards Text Generator", "https://www.backwardstextgenerator.net/privacy/");
  await assertPage("/terms/", "Terms of Use - Backwards Text Generator", "https://www.backwardstextgenerator.net/terms/");

  const robots = await fetch(`${baseUrl}/robots.txt`);
  if (robots.status !== 200 || !(await robots.text()).includes("Sitemap: https://www.backwardstextgenerator.net/sitemap.xml")) {
    throw new Error("robots.txt check failed.");
  }

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapText = await sitemap.text();
  if (sitemap.status !== 200 || !sitemapText.includes("https://www.backwardstextgenerator.net/upside-down-text/")) {
    throw new Error("sitemap.xml check failed.");
  }

  const missing = await fetch(`${baseUrl}/definitely-not-a-real-page/`);
  if (missing.status !== 404) {
    throw new Error(`Missing page returned ${missing.status}, expected 404.`);
  }
} finally {
  if (isWindows && server.pid) {
    try {
      execFileSync("taskkill.exe", ["/pid", String(server.pid), "/t", "/f"], {
        stdio: "ignore"
      });
    } catch {
      // The preview process may already be closed.
    }
  } else {
    server.kill();
  }
}
