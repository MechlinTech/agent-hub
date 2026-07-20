/**
 * Creates initial branded placeholder WebP assets when capture credentials are unavailable.
 * Replace by running: npm run capture-landing-media
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = join(root, "website", "public", "media");

const agents = [
  {
    id: "script-review",
    title: "Script Review Agent",
    subtitle: "JMeter script review & BlazeMeter readiness",
  },
  {
    id: "results-analysis",
    title: "Results Analysis Agent",
    subtitle: "BlazeMeter & CSV performance insights",
  },
  {
    id: "project-setup",
    title: "Dev Scaffold Agent",
    subtitle: "Scaffold stacks via Local Executor",
  },
];

async function main() {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    const { spawnSync } = await import("node:child_process");
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

  const { chromium } = playwright;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const agent of agents) {
    const dir = join(mediaRoot, agent.id);
    mkdirSync(dir, { recursive: true });

    const html = (label) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: system-ui, sans-serif;
    min-height: 900px;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #f6f5fb 100%);
    color: #1e1b4b;
    padding: 48px;
  }
  .card {
    background: rgba(255,255,255,0.85);
    border-radius: 24px;
    padding: 40px;
    max-width: 900px;
    box-shadow: 0 8px 24px rgba(30,27,75,0.08);
    border: 1px solid rgba(255,255,255,0.8);
  }
  .badge {
    display: inline-block;
    background: linear-gradient(90deg, #6d28d9, #9333ea);
    color: white;
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 24px;
  }
  h1 { font-size: 36px; margin-bottom: 12px; }
  p { font-size: 18px; opacity: 0.75; line-height: 1.5; }
  .label { margin-top: 32px; font-size: 14px; color: #6d28d9; font-weight: 600; }
</style></head>
<body>
  <div class="card">
    <div class="badge">Agent Hub</div>
    <h1>${agent.title}</h1>
    <p>${agent.subtitle}</p>
    <p class="label">${label}</p>
  </div>
</body></html>`;

    const files = [
      ["hero.png", "Primary preview"],
      ["screen-new-review.png", "Workflow"],
      ["screen-results.png", "Results view"],
      ["screen-overview.png", "Overview"],
      ["screen-new.png", "New session"],
      ["screen-wizard.png", "Configuration wizard"],
    ];

    for (const [file, label] of files) {
      if (file === "screen-new-review.png" && agent.id !== "script-review") continue;
      if (file === "screen-results.png" && agent.id !== "script-review") continue;
      if (file === "screen-wizard.png" && agent.id !== "project-setup") continue;
      if (file === "screen-overview.png" && agent.id === "script-review") continue;
      if (file === "screen-new.png" && agent.id === "script-review") continue;

      await page.setContent(html(label));
      await page.screenshot({
        path: join(dir, file),
        type: "png",
        fullPage: false,
      });
    }

    const videoTmp = join(dir, "_video_tmp");
    mkdirSync(videoTmp, { recursive: true });
    const videoContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: videoTmp, size: { width: 1280, height: 720 } },
    });
    const videoPage = await videoContext.newPage();
    await videoPage.setContent(html("Demo preview"));
    await videoPage.waitForTimeout(4000);
    await videoContext.close();

    const { readdirSync, copyFileSync } = await import("node:fs");
    const { spawnSync } = await import("node:child_process");
    const webm = readdirSync(videoTmp).find((f) => f.endsWith(".webm"));
    if (webm) {
      const webmPath = join(videoTmp, webm);
      const demoOut = join(dir, "demo.mp4");
      const ffmpeg = spawnSync(
        "ffmpeg",
        ["-y", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", demoOut],
        { stdio: "ignore" }
      );
      if (ffmpeg.status !== 0) {
        copyFileSync(webmPath, join(dir, "demo.webm"));
      }
    }
  }

  await browser.close();
  console.log("Generated placeholder media under website/public/media");
}

main();
