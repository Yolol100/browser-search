# ChatGPT / OpenAI integration

## Preferred private route: Secure MCP Tunnel

ChatGPT does not connect directly to a local MCP process. Keep this repository private to the machine/network and expose the stdio MCP command through OpenAI Secure MCP Tunnel.

1. Install and verify this project locally:

```bash
npm ci
npx playwright install chromium
npm run verify
npm run browser-smoke
```

2. Create a Secure MCP Tunnel in OpenAI Platform tunnel settings and install the current `tunnel-client` release.

3. Configure a named stdio profile. Replace paths and tunnel id with your own values:

```bash
export CONTROL_PLANE_API_KEY='...'

tunnel-client init \
  --sample sample_mcp_stdio_local \
  --profile browser-search \
  --tunnel-id tunnel_REPLACE_ME \
  --mcp-command "node /absolute/path/browser-search/src/mcp-server.mjs"

tunnel-client doctor --profile browser-search --explain
tunnel-client run --profile browser-search
```

4. In ChatGPT developer mode / custom apps, connect the OpenAI-hosted tunnel endpoint and verify that exactly one tool is exposed: `browser_search`.

Keep `tunnel-client run` healthy while using the app. The tunnel uses outbound HTTPS and does not require a public inbound port to this service.

## Local MCP hosts

For a local MCP-capable tool such as a development client, invoke:

```bash
npm run mcp
```

The MCP protocol uses stdout. Normal diagnostics go to stderr.

## HTTP/OpenAPI route

The HTTP API can be used by a private service or legacy/action-style integration. For a hosted integration, terminate TLS and authentication outside this process. Prefer MCP + Secure MCP Tunnel for ChatGPT rather than opening this local service to the public internet.

## Product boundary

Full custom MCP capabilities in ChatGPT depend on plan/workspace and developer-mode availability. Treat OpenAI product availability as a live platform fact and recheck official documentation when deploying.
