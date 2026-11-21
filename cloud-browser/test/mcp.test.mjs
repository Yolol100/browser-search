import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const serverPath = fileURLToPath(new URL("../src/server.mjs", import.meta.url));
const port = 18765;
const endpoint = "http://127.0.0.1:" + port + "/mcp";

test("private MCP server responds with browser tools and inline widget resource", { timeout: 20000 }, async () => {
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, BROWSER_BIND: "127.0.0.1", PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"]
  });
  let errors = "";
  child.stderr.on("data", (data) => { errors += data.toString().slice(0, 1200); });
  const client = new Client({ name: "browser-mcp-test", version: "0.1.0" });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) break;
      try {
        const res = await fetch("http://127.0.0.1:" + port + "/health", { signal: AbortSignal.timeout(250) });
        if (res.ok && (await res.json()).private) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    assert.ok(ready, "Server failed to start: " + errors);
    const transport = new StreamableHTTPClientTransport(new URL(endpoint));
    await client.connect(transport);
    const tools = await client.listTools();
    const names = tools.tools.map((entry) => entry.name);
    assert.ok(names.includes("browser_open"), "Missing browser_open tool");
    assert.ok(names.includes("browser_action"), "Missing browser_action tool");
    assert.ok(names.includes("browser_frame"), "Missing screenshot tool");

    const resource = await client.readResource({ uri: "ui://webactueel-browser/browser.html" });
    assert.match(resource.contents[0].text, /Webactueel Browser/);

    const invalid = await client.callTool({
      name: "browser_open",
      arguments: { url: "http://127.0.0.1/private" }
    });
    assert.equal(invalid.isError, true, "Private network URL should be rejected");
  } finally {
    await client.close().catch(() => {});
    child.kill("SIGTERM");
  }
});
