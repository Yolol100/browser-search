# ChatGPT integration

The repository only needs one ChatGPT integration path: the local stdio MCP server through OpenAI Secure MCP Tunnel.

ChatGPT does not connect directly to a local MCP process. Secure MCP Tunnel lets the local server remain private while supported OpenAI products call it over an outbound tunnel.

## 1. Prepare browser-search

```bash
npm ci
npx playwright install chromium
npm run verify
npm run browser-smoke
npm run mcp-smoke
```

## 2. Run the MCP server locally

```bash
npm run mcp
```

It exposes one read-only tool:

`browser_search(query, limit?, language?, country?)`

## 3. Connect it to OpenAI

Create a Secure MCP Tunnel in OpenAI Platform and configure `tunnel-client` to launch this repository's stdio server.

Conceptually the command is:

```bash
node /absolute/path/browser-search/src/mcp-server.mjs
```

Use the exact current `tunnel-client` setup instructions from OpenAI's Secure MCP Tunnel documentation when configuring the machine.

## Intended use in ChatGPT

Use ChatGPT's normal/native Search as the main web-search source. Call `browser_search` when an additional Google result view is useful.

Then:

1. keep `source=google-browser` provenance;
2. deduplicate overlapping URLs;
3. open and verify useful destination sources separately;
4. do not treat Google snippets as final evidence;
5. if Google returns consent/blocking/layout failure, continue with other available sources rather than bypassing Google controls.

Official docs:

- https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt
