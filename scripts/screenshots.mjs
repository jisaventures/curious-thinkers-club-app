import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:43123";
const out = "/workspace/docs/screenshots";
const chrome = "/opt/google/chrome/chrome";

const sizes = [
  ["390", 390, 844],
  ["820", 820, 1180],
  ["1440", 1440, 1100],
];

async function openFamily(page) {
  await page.goto(`${base}/club`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 20000 });
}

async function openAdmin(page) {
  await openFamily(page);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.trim() === "Admin");
      button?.click();
    }),
  ]);
  await page.waitForSelector("h1", { timeout: 20000 });
}

async function shot(page, url, file, selector) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(selector, { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await page.screenshot({ path: `${out}/${file}`, fullPage: true });
  console.log(file);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

await mkdir(out, { recursive: true });
const sam = await browser.newPage();
await openFamily(sam);

for (const [name, width, height] of sizes) {
  await sam.setViewport({ width, height, deviceScaleFactor: 1 });
  await shot(sam, `${base}/club`, `dashboard-${name}.png`, "h1");
  await shot(
    sam,
    `${base}/club/packs/be-a-pirate-for-the-day?mode=together&child=c1000000-0000-4000-8000-000000000001`,
    `pack-together-${name}.png`,
    "h1",
  );
  await shot(
    sam,
    `${base}/club/packs/be-a-pirate-for-the-day?mode=solo&child=c1000000-0000-4000-8000-000000000002`,
    `pack-solo-${name}.png`,
    "h1",
  );
}

const admin = await browser.newPage();
await openAdmin(admin);
for (const [name, width, height] of sizes) {
  await admin.setViewport({ width, height, deviceScaleFactor: 1 });
  await shot(admin, `${base}/admin/packs`, `admin-${name}.png`, "h1");
}

await browser.close();
