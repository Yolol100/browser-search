import assert from "node:assert/strict";
import { BrowserService } from "../src/browser.mjs";

const browser = new BrowserService();
try {
  // In-memory page: no external website, account, credentials or network requests.
  await browser.ensureOpen();
  await browser.page.setContent(String.raw`<!doctype html><html><head><title>Offline action fixture</title>
<style>body{margin:0;height:2400px;font:20px sans-serif}#box{position:absolute;left:24px;top:30px}
button{margin-top:14px}#bottom{position:absolute;top:1800px;left:20px}</style>
</head><body><div id="box"><input id="target" aria-label="safe demo input">
<button id="button" onclick="document.getElementById('result').textContent='clicked'">Click demo</button>
<p id="result">waiting</p></div><div id="bottom">scroll target</div></body></html>`);
  const inputRect = await browser.page.locator("#target").boundingBox();
  assert.ok(inputRect, "Demo input is visible");
  await browser.action({ action: "click", x: Math.floor(inputRect.x + 12), y: Math.floor(inputRect.y + 12) });
  await browser.action({ action: "type", text: "safe test text" });
  assert.equal(await browser.page.locator("#target").inputValue(), "safe test text");

  const buttonRect = await browser.page.locator("#button").boundingBox();
  await browser.action({ action: "click", x: Math.floor(buttonRect.x + 12), y: Math.floor(buttonRect.y + 12) });
  assert.equal(await browser.page.locator("#result").textContent(), "clicked");

  await browser.action({ action: "scroll", deltaY: 620 });
  assert.ok(await browser.page.evaluate(() => window.scrollY) > 100, "Page scrolled down");

  const frame = await browser.frame();
  assert.equal(frame.status, "open");
  assert.match(frame.image, /^data:image\/jpeg;base64,/);
  assert.ok(frame.image.length > 500, "Screenshot contains visible image data");

  for (const url of [
    "http://127.0.0.1:8765/health",
    "https://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "https://unapproved.example.test/"
  ]) await assert.rejects(browser.action({ action: "navigate", url }), /allowed|HTTPS|URL|domain/i);

  const closed = await browser.action({ action: "close" });
  assert.equal(closed.status, "closed");
  console.log("BROWSER_ACTIONS_SMOKE PASS: click, type, scroll, screenshot, close and blocked destinations (offline fixture)");
} finally {
  await browser.shutdown();
}
