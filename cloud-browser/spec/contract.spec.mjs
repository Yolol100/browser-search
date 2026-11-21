import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = fs.readFileSync(path.join(root, "src/server.mjs"), "utf8");
const widget = fs.readFileSync(path.join(root, "src/widget.html"), "utf8");
const devcontainer = JSON.parse(fs.readFileSync(path.join(root, "../.devcontainer/devcontainer.json"), "utf8"));

test("MCP has tool, app-only frames and HTML widget resource", () => {
  assert.match(server, /registerAppTool\(server, "browser_open"/);
  assert.match(server, /registerAppTool\(server, "browser_action"/);
  assert.match(server, /registerAppTool\(server, "browser_frame"/);
  assert.match(server, /visibility: \["app"\]/);
  assert.match(server, /registerAppResource\(server/);
  assert.match(server, /StreamableHTTPServerTransport/);
});

test("UI has interactive browser controls and no external scripts", () => {
  assert.match(widget, /window\.openai/);
  assert.match(widget, /api\.callTool\(name, args\)/);
  assert.match(widget, /id="screen"/);
  assert.match(widget, /action\("navigate"/);
  assert.doesNotMatch(widget, /<script\s+src=/i);
});

test("server defaults to local-only binding and Codespaces keeps ports private by default", () => {
  assert.match(server, /process\.env\.BROWSER_BIND \|\| "127\.0\.0\.1"/);
  assert.match(server, /Refusing public bind/);
  assert.ok(devcontainer.forwardPorts.includes(8765));
  assert.deepEqual(devcontainer.features["ghcr.io/devcontainers/features/sshd:1"], { gatewayPorts: "no" });
  assert.doesNotMatch(JSON.stringify(devcontainer), /"visibility"\s*:\s*"public"/);
});
