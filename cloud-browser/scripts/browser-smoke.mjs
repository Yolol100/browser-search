import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });
  await page.setContent('<!doctype html><title>Browser smoke</title><h1>Local Chromium test</h1>');
  const title = await page.title();
  const image = await page.screenshot({ type: "jpeg", quality: 55 });
  if (title !== "Browser smoke" || image.length < 100) throw new Error("Browser screenshot smoke failed");
  console.log("Chromium offline screenshot smoke PASS, bytes: " + image.length);
} finally {
  await browser.close();
}
