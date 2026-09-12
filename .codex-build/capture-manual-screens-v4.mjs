import { chromium } from "file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = "C:/NogorShomadhan/.codex-build/screens-hires";
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: "light" });
await context.addInitScript(() => localStorage.setItem("acc_id", "4f969cfd-41e8-457d-bb43-644c039e1191"));
const captures = [
  ["authority-action-form", "/authority/complaints/dc530757-0da4-4f71-8c08-ce6eb12949ef", 1880],
  ["authority-action-form-lower", "/authority/complaints/dc530757-0da4-4f71-8c08-ce6eb12949ef", 2500],
  ["resident-feedback", "/(resident)/complaints/977a668b-647a-4958-ab54-d0569d224be3", 1900],
];
for (const [name, route, scrollY] of captures) {
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.goto(`http://localhost:8081${route}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate((y) => {
    const candidates = [...document.querySelectorAll("*")]
      .filter((el) => el.scrollHeight > el.clientHeight + 80)
      .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    if (candidates[0]) candidates[0].scrollTop = y;
  }, scrollY);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  await page.close();
}
await browser.close();
