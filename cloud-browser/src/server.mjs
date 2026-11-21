import express from "express";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { BrowserService } from "./browser.mjs";

const service = new BrowserService();
const WIDGET_URI = "ui://webactueel-browser/browser.html";
const widgetHtml = fs.readFileSync(new URL("./widget.html", import.meta.url), "utf8");
const bindHost = process.env.BROWSER_BIND || "127.0.0.1";
const port = Number(process.env.PORT || 8765);

if (!["127.0.0.1", "::1"].includes(bindHost)) {
  throw new Error("Refusing public bind: use private Codespaces port and authenticated MCP tunnel");
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("Invalid PORT");
}

function response(data, includeStructured = true) {
  const result = { content: [{ type: "text", text: JSON.stringify(data) }] };
  if (includeStructured) result.structuredContent = data;
  return result;
}

function safeError(err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  return { content: [{ type: "text", text: message.slice(0, 240) }], isError: true };
}

function createMcpServer() {
  const server = new McpServer({ name: "webactueel-private-browser", version: "0.1.0" });

  registerAppTool(server, "browser_open", {
    title: "Open private browser",
    description: "Open the embedded cloud browser and navigate to an explicitly allowlisted HTTPS website. Defaults to example.com. The Codespace must be running; never enter passwords.",
    inputSchema: { url: z.string().optional() },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    _meta: { ui: { resourceUri: WIDGET_URI } }
  }, async ({ url }) => {
    try { return response(await service.open(url || "https://example.com/")); }
    catch (err) { return safeError(err); }
  });

  registerAppTool(server, "browser_action", {
    title: "Interact with private browser",
    description: "Navigate to an allowlisted HTTPS URL, click viewport coordinates, type non-sensitive text, scroll, go back, refresh, or close the browser. This is an isolated proof of concept, not for sign-ins, purchases, uploads, or confidential data.",
    inputSchema: {
      action: z.enum(["navigate", "click", "type", "scroll", "back", "reload", "close"]),
      url: z.string().optional(),
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      text: z.string().max(500).optional(),
      deltaY: z.number().optional()
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true }
  }, async (args) => {
    try { return response(await service.action(args)); }
    catch (err) { return safeError(err); }
  });

  registerAppTool(server, "browser_frame", {
    title: "Retrieve browser frame",
    description: "App-only browser screenshot. Do not show screenshot base64 to the model.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: { ui: { visibility: ["app"] } }
  }, async () => {
    try { return response(await service.frame()); }
    catch (err) { return safeError(err); }
  });

  registerAppResource(server, "Private browser widget", WIDGET_URI, {
    mimeType: RESOURCE_MIME_TYPE,
    description: "Inline interactive private Chromium view"
  }, async () => ({
    contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml }]
  }));
  return server;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "128kb" }));
app.use((req, res, next) => {
  // Reject untrusted browser origins and DNS rebinding attempts.
  const origin = req.headers.origin;
  if (origin && !["http://127.0.0.1:" + port, "http://localhost:" + port].includes(origin)) {
    res.status(403).json({ error: "Forbidden origin" });
    return;
  }
  next();
});
app.get("/health", (_req, res) => res.json({ status: "ok", private: true }));

app.all("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "MCP error" }, id: null });
    }
  }
});

const listener = app.listen(port, bindHost, () => {
  console.log("Private browser MCP listening on http://" + bindHost + ":" + port + "/mcp");
  console.log("Keep forwarded Codespaces port PRIVATE. No auth has been configured for public access.");
});
async function stop() {
  listener.close();
  await service.shutdown();
}
process.on("SIGINT", () => stop().then(() => process.exit(0)));
process.on("SIGTERM", () => stop().then(() => process.exit(0)));
