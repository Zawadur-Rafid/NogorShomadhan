import { chromium } from "file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = "C:/NogorShomadhan/.codex-build/screens-hires";
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});

const captures = [
  ["resident-dashboard", "/(resident)/dashboard", 0],
  ["resident-create-top", "/(resident)/complaints/create", 0],
  ["resident-create-bottom", "/(resident)/complaints/create", 610],
  ["resident-complaints", "/(resident)/complaints", 0],
  ["resident-resolved-top", "/(resident)/complaints/977a668b-647a-4958-ab54-d0569d224be3", 0],
  ["resident-resolved-bottom", "/(resident)/complaints/977a668b-647a-4958-ab54-d0569d224be3", 1180],
  ["authority-dashboard", "/authority/dashboard", 0],
  ["authority-complaints", "/authority/complaints", 0],
  ["authority-inprogress-top", "/authority/complaints/dc530757-0da4-4f71-8c08-ce6eb12949ef", 0],
  ["authority-inprogress-actions", "/authority/complaints/dc530757-0da4-4f71-8c08-ce6eb12949ef", 1120],
  ["authority-resolved", "/authority/complaints/977a668b-647a-4958-ab54-d0569d224be3", 1050],
  ["admin-dashboard", "/(admin)/dashboard", 0],
  ["admin-review", "/(admin)/complaints/review", 0],
  ["admin-duplicate", "/(admin)/duplicates/d8a1f331-1a95-49e0-8da2-d48e48ef1c2c", 0],
  ["admin-analytics", "/(admin)/analytics", 0],
  ["resident-analytics", "/(resident)/analytics", 0],
  ["resident-notifications", "/(resident)/notifications", 0],
];

for (const [name, route, scrollY] of captures) {
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.goto(`http://localhost:8081${route}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1800);
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollY);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  await page.close();
}

await browser.close();
