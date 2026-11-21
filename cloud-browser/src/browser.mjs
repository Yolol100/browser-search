import { chromium } from "playwright";
import { allowedHosts, safeUrl, assertPublicDns } from "./security.mjs";

const WIDTH = 1024;
const HEIGHT = 640;

export class BrowserService {
  constructor() {
    this.hosts = allowedHosts();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.queue = Promise.resolve();
  }

  serial(task) {
    const current = this.queue.then(task, task);
    this.queue = current.catch(() => {});
    return current;
  }

  async ensureOpen() {
    if (this.page) return;
    this.browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage"]
    });
    this.context = await this.browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      acceptDownloads: false,
      serviceWorkers: "block",
      permissions: []
    });
    await this.context.route("**/*", async (route) => {
      try {
        const url = safeUrl(route.request().url(), this.hosts);
        await assertPublicDns(url);
        await route.continue();
      } catch {
        await route.abort().catch(() => {});
      }
    });
    if (typeof this.context.routeWebSocket === "function") {
      await this.context.routeWebSocket("**/*", (socket) => socket.close());
    }
    this.context.on("page", (page) => {
      if (page !== this.page) page.close().catch(() => {});
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(5000);
    this.page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
  }

  async summary(includeFrame = false) {
    if (!this.page) return { status: "closed", url: null, title: null, image: null };
    const info = {
      status: "open",
      url: this.page.url(),
      title: (await this.page.title().catch(() => "")) || "Browser",
      width: WIDTH,
      height: HEIGHT
    };
    if (includeFrame) {
      const image = await this.page.screenshot({ type: "jpeg", quality: 55, timeout: 6000 });
      info.image = "data:image/jpeg;base64," + image.toString("base64");
    }
    return info;
  }

  async open(url = "https://example.com/") {
    return this.serial(async () => {
      const validated = safeUrl(url, this.hosts);
      await assertPublicDns(validated);
      await this.ensureOpen();
      await this.page.goto(validated, { waitUntil: "domcontentloaded", timeout: 15000 });
      return this.summary();
    });
  }

  async frame() {
    return this.serial(async () => this.summary(true));
  }

  async action(params) {
    return this.serial(async () => {
      if (params.action === "close") {
        await this.closeBrowser();
        return this.summary();
      }
      await this.ensureOpen();
      switch (params.action) {
        case "navigate": {
          const validated = safeUrl(params.url, this.hosts);
          await assertPublicDns(validated);
          await this.page.goto(validated, { waitUntil: "domcontentloaded", timeout: 15000 });
          break;
        }
        case "back":
          await this.page.goBack({ waitUntil: "domcontentloaded", timeout: 12000 });
          break;
        case "reload":
          await this.page.reload({ waitUntil: "domcontentloaded", timeout: 12000 });
          break;
        case "click": {
          if (!Number.isInteger(params.x) || !Number.isInteger(params.y) ||
              params.x < 0 || params.x >= WIDTH || params.y < 0 || params.y >= HEIGHT) {
            throw new Error("Click outside allowed viewport");
          }
          await this.page.mouse.click(params.x, params.y);
          break;
        }
        case "type":
          if (typeof params.text !== "string" || params.text.length > 500) {
            throw new Error("Invalid text length");
          }
          await this.page.keyboard.insertText(params.text);
          break;
        case "scroll": {
          const dy = Number(params.deltaY);
          if (!Number.isFinite(dy) || Math.abs(dy) > 1200) {
            throw new Error("Invalid scroll distance");
          }
          await this.page.mouse.wheel(0, dy);
          break;
        }
        default:
          throw new Error("Unsupported browser action");
      }
      return this.summary();
    });
  }

  async closeBrowser() {
    const browser = this.browser;
    this.browser = null;
    this.context = null;
    this.page = null;
    if (browser) await browser.close().catch(() => {});
  }

  async shutdown() {
    return this.serial(() => this.closeBrowser());
  }
}
