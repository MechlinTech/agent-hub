/**
 * High-quality landing media capture.
 *
 * Requires: npm run dev (default http://localhost:3040)
 *   CAPTURE_EMAIL / CAPTURE_PASSWORD (or set below via env)
 *
 * Produces PNG screenshots + interactive MP4 demos under website/public/media/
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  existsSync,
  readdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = join(root, "website", "public", "media");
const statePath = join(root, ".capture-auth.json");

function loadCaptureEnvFromDotenv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key.startsWith("CAPTURE_")) continue;
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

loadCaptureEnvFromDotenv();

const baseUrl = process.env.CAPTURE_BASE_URL ?? "http://localhost:3040";
const email = process.env.CAPTURE_EMAIL ?? "";
const password = process.env.CAPTURE_PASSWORD ?? "";

function ensureFfmpeg() {
  try {
    return require("@ffmpeg-installer/ffmpeg").path;
  } catch {
    console.log("Installing @ffmpeg-installer/ffmpeg…");
    spawnSync("npm", ["install", "@ffmpeg-installer/ffmpeg", "--no-save"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    return require("@ffmpeg-installer/ffmpeg").path;
  }
}

function convertToMp4(ffmpegPath, webmPath, mp4Path) {
  const result = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-i",
      webmPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4Path,
    ],
    { stdio: "inherit" }
  );
  return result.status === 0 && existsSync(mp4Path);
}

async function loginAndSaveState(chromium) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForNavigation({ timeout: 90000, waitUntil: "domcontentloaded" }).catch(() => null),
    page.locator('form button[type="submit"]').click(),
  ]);
  for (let i = 0; i < 45; i++) {
    if (!page.url().includes("/login")) break;
    await page.waitForTimeout(1000);
  }
  if (page.url().includes("/login")) {
    throw new Error("Login failed");
  }
  await page.waitForTimeout(1500);
  await context.storageState({ path: statePath });
  await browser.close();
  console.log("Saved auth state for", email);
}

async function waitReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1200);
  // Prefer app shell content over login
  if (page.url().includes("/login")) {
    throw new Error(`Redirected to login: ${page.url()}`);
  }
}

async function shot(page, outPath) {
  await page.waitForTimeout(800);
  // Full viewport keeps chrome + content crisp; avoids duplicate main-only crops
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
  console.log("Wrote", outPath);
}

async function firstHref(page, selector) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  const href = await el.getAttribute("href");
  if (!href) return null;
  return href.startsWith("http") ? href : `${baseUrl}${href}`;
}

async function gotoShot(page, path, outPath) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await shot(page, outPath);
}

async function captureScreenshots(chromium) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: statePath,
  });
  const page = await context.newPage();

  // --- Script Review: overview | new review | configure rules (or results/history) ---
  const srDir = join(mediaRoot, "script-review");
  mkdirSync(srDir, { recursive: true });
  await gotoShot(page, "/agents/script-review", join(srDir, "hero.png"));
  await gotoShot(page, "/agents/script-review/new", join(srDir, "screen-new.png"));

  await page.goto(`${baseUrl}/agents/script-review/history`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  const resultsUrl = await firstHref(
    page,
    'a[href*="/agents/script-review/"][href*="/results"]'
  );
  if (resultsUrl) {
    await page.goto(resultsUrl, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await shot(page, join(srDir, "screen-detail.png"));
  } else {
    await gotoShot(page, "/agents/script-review/configure", join(srDir, "screen-detail.png"));
  }

  // --- Results Analysis: overview | new | detail/SLA ---
  const raDir = join(mediaRoot, "results-analysis");
  mkdirSync(raDir, { recursive: true });
  await gotoShot(page, "/agents/results-analysis", join(raDir, "hero.png"));
  await gotoShot(page, "/agents/results-analysis/new", join(raDir, "screen-new.png"));

  await page.goto(`${baseUrl}/agents/results-analysis`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  let detailUrl = null;
  const links = page.locator('a[href*="/agents/results-analysis/"]');
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (!href) continue;
    if (
      /\/agents\/results-analysis\/[0-9a-f-]{8,}/i.test(href) &&
      !href.includes("/analyzing") &&
      !href.includes("/library")
    ) {
      detailUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      break;
    }
  }
  if (detailUrl) {
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await page.waitForTimeout(1500);
    await shot(page, join(raDir, "screen-detail.png"));
  } else {
    await gotoShot(page, "/agents/results-analysis/sla", join(raDir, "screen-detail.png"));
  }

  // --- Dev Scaffold: overview | wizard configure | history (or review step) ---
  const psDir = join(mediaRoot, "project-setup");
  mkdirSync(psDir, { recursive: true });
  await page.goto(`${baseUrl}/agents/project-setup`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  const how = page.getByText("How Dev Scaffold works");
  if ((await how.count()) > 0) {
    await how.first().click().catch(() => null);
    await page.waitForTimeout(600);
  }
  await shot(page, join(psDir, "hero.png"));

  await page.goto(`${baseUrl}/agents/project-setup/new`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.waitForTimeout(1000);
  const scope = page.getByText("Full Stack", { exact: false }).first();
  if ((await scope.count()) > 0) await scope.click().catch(() => null);
  await page.waitForTimeout(500);
  await shot(page, join(psDir, "screen-wizard.png"));

  await gotoShot(page, "/agents/project-setup/history", join(psDir, "screen-history.png"));

  await browser.close();
}

async function recordDemo(chromium, ffmpegPath, agent, pathSequence) {
  const dir = join(mediaRoot, agent);
  mkdirSync(dir, { recursive: true });
  const videoDir = join(dir, "_video_tmp");
  if (existsSync(videoDir)) rmSync(videoDir, { recursive: true, force: true });
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    storageState: statePath,
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  for (const step of pathSequence) {
    await page.goto(`${baseUrl}${step.path}`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    if (step.clickText) {
      const t = page.getByText(step.clickText, { exact: false }).first();
      if ((await t.count()) > 0) await t.click().catch(() => null);
    }
    // Slow scroll so the recording shows motion
    await page.evaluate(async () => {
      const main = document.querySelector("main") || document.scrollingElement;
      if (!main) return;
      const max = Math.max(0, (main.scrollHeight || 800) - 400);
      for (let y = 0; y <= max; y += 80) {
        main.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      main.scrollTo(0, 0);
    });
    await page.waitForTimeout(step.dwellMs ?? 2500);
  }

  await page.waitForTimeout(1000);
  await context.close();
  await browser.close();

  const webm = readdirSync(videoDir).find((f) => f.endsWith(".webm"));
  if (!webm) {
    console.warn("No video recorded for", agent);
    return;
  }
  const webmPath = join(videoDir, webm);
  const mp4Path = join(dir, "demo.mp4");
  const webmOut = join(dir, "demo.webm");

  if (convertToMp4(ffmpegPath, webmPath, mp4Path)) {
    console.log("Wrote", mp4Path);
    // Keep a webm copy as fallback
    copyFileSync(webmPath, webmOut);
  } else {
    copyFileSync(webmPath, webmOut);
    console.warn("MP4 convert failed for", agent, "- kept", webmOut);
  }

  rmSync(videoDir, { recursive: true, force: true });
}

async function main() {
  if (!email || !password) {
    throw new Error("Set CAPTURE_EMAIL and CAPTURE_PASSWORD");
  }

  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    spawnSync("npm", ["install", "playwright", "--no-save"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    playwright = await import("playwright");
    spawnSync("npx", ["playwright", "install", "chromium"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
  }

  const ffmpegPath = ensureFfmpeg();
  const { chromium } = playwright;

  await loginAndSaveState(chromium);
  await captureScreenshots(chromium);

  if (process.env.CAPTURE_SKIP_VIDEO !== "1") {
    await recordDemo(chromium, ffmpegPath, "script-review", [
      { path: "/agents/script-review", dwellMs: 2800 },
      { path: "/agents/script-review/new", dwellMs: 3500 },
      { path: "/agents/script-review/history", dwellMs: 2800 },
    ]);

    await recordDemo(chromium, ffmpegPath, "results-analysis", [
      { path: "/agents/results-analysis", dwellMs: 3000 },
      { path: "/agents/results-analysis/new", dwellMs: 3200 },
      { path: "/agents/results-analysis/history", dwellMs: 2500 },
    ]);

    await recordDemo(chromium, ffmpegPath, "project-setup", [
      { path: "/agents/project-setup", clickText: "How Dev Scaffold works", dwellMs: 3200 },
      { path: "/agents/project-setup/new", dwellMs: 4000 },
    ]);
  } else {
    console.log("CAPTURE_SKIP_VIDEO=1 - keeping existing demo videos");
  }

  // Prefer mp4 in content file
  const agentsContentPath = join(root, "website", "src", "content", "agents.ts");
  let content = readFileSync(agentsContentPath, "utf8");
  content = content.replaceAll("demo.webm", "demo.mp4");
  writeFileSync(agentsContentPath, content);

  spawnSync("npm", ["run", "sync-website-public"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  console.log("Done. Synced media to public/media.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
