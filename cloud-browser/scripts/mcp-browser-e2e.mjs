import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const port = 18876;
const host = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["src/server.mjs"], {
  cwd: new URL("../", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    BROWSER_BIND: "127.0.0.1",
    BROWSER_ALLOWED_HOSTS: "example.com"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let started = "";
let errors = "";
child.stdout.on("data", (b) => { started += b.toString().slice(0, 300); });
child.stderr.on("data", (b) => { errors += b.toString().slice(0, 300); });
const client = new Client({ name: "cloud-browser-e2e", version: "1.0.0" });
function unpack(result) {
  if (result.isError) throw new Error("MCP tool returned error: " + (result.content?.[0]?.text || "unknown"));
  return result.structuredContent || JSON.parse(result.content[0].text);
}
async function tool(name, args) {
  return unpack(await client.callTool({ name, arguments: args }));
}

try {
  let healthy = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(host + "/health", { signal: AbortSignal.timeout(300) });
      if (response.ok) { healthy = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(healthy, "MCP server failed to start " + errors);
  assert.match(started, /Private browser MCP listening/);

  const unsafeOrigin = await fetch(host + "/mcp", {
    method: "POST", headers: { "origin": "https://malicious.example", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", params: {}, id: 1 })
  });
  assert.equal(unsafeOrigin.status, 403, "Untrusted Origin should be rejected");

  await client.connect(new StreamableHTTPClientTransport(new URL(host + "/mcp")));
  const tools = await client.listTools();
  for (const name of ["browser_open", "browser_action", "browser_frame"]) {
    assert.ok(tools.tools.some((item) => item.name === name), "Missing " + name);
  }
  const resource = await client.readResource({ uri: "ui://webactueel-browser/browser.html" });
  assert.match(resource.contents[0]?.text || "", /id="screen"/);

  const opened = await tool("browser_open", { url: "https://example.com/" });
  assert.equal(opened.status, "open");
  assert.ok(opened.url.startsWith("https://example.com/"), "Navigation must stay on allowed domain");
  const screenshot = await tool("browser_frame", {});
  assert.match(screenshot.image || "", /^data:image\/jpeg;base64,/);
  assert.ok(screenshot.image.length > 500);

  // Reserved test page: actions are harmless. Navigation is a real HTTPS request.
  await tool("browser_action", { action: "click", x: 12, y: 12 });
  await tool("browser_action", { action: "type", text: "offline-safe-demo" });
  await tool("browser_action", { action: "scroll", deltaY: 250 });
  const refreshed = await tool("browser_action", { action: "navigate", url: "https://example.com/" });
  assert.ok(refreshed.url.startsWith("https://example.com/"));

  for (const url of ["https://127.0.0.1/", "http://169.254.169.254/latest/meta-data/", "https://not-allowlisted.invalid/"]) {
    const denied = await client.callTool({ name: "browser_action", arguments: { action: "navigate", url } });
    assert.equal(denied.isError, true, "Forbidden navigation should be rejected");
  }
  const afterDenial = await tool("browser_frame", {});
  assert.equal(afterDenial.status, "open");
  assert.ok(afterDenial.url.startsWith("https://example.com/"), "Forbidden navigation must not change URL");

  assert.equal((await tool("browser_action", { action: "close" })).status, "closed");
  console.log("MCP_BROWSER_E2E PASS: actual server, MCP tools, inline resource, HTTPS navigation, click, type, scroll, frame, SSRF blocks, close");
} finally {
  await client.close().catch(() => {});
  child.kill("SIGTERM");
}
