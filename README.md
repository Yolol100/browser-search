# Webactueel Browser Search

A small, bounded browser-search bridge for agent workflows. It opens Google Search with Playwright/Chromium, returns normalized organic result URLs, and deliberately stops on consent ambiguity, CAPTCHA, or Google's automated-traffic warning.

## Why this exists

The intended workflow is:

`ChatGPT/OpenAI Search + this browser-search bridge -> dedupe/compare sources -> final answer`

This project does **not** replace OpenAI Search and does not claim to be an unlimited Google API. Google explicitly identifies queries sent by computer programs and search scrapers as automated traffic and may block them.

## Safety and policy boundaries

- No CAPTCHA solving or bypass.
- No proxy rotation, fingerprint spoofing, stealth plugins, or block evasion.
- One Google request at a time with a configurable cooldown.
- No automatic crawling of result websites; only normalized result metadata is returned.
- Loopback-only HTTP binding by default. A bearer token is mandatory for non-loopback binds.
- Consent is `manual` by default. `accept` or `reject` must be explicitly configured.

## Requirements

- Node.js 22+
- Playwright 1.63.0
- Chromium installed through Playwright

## Install

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Environment variables can be loaded by your process manager or shell. The service itself does not parse `.env` files.

## CLI

```bash
GOOGLE_CONSENT_MODE=reject npm run search -- "WordPress performance 2026" 5 nl
```

## Local HTTP API

```bash
npm start
curl -s http://127.0.0.1:8787/health
curl -s -X POST http://127.0.0.1:8787/v1/search \
  -H 'content-type: application/json' \
  -d '{"query":"WordPress performance 2026","limit":5,"language":"nl"}'
```

See `openapi.yaml` for the machine-readable API contract.

## MCP stdio server

```bash
npm run mcp
```

The MCP server uses the current v2 `@modelcontextprotocol/server` package and exposes exactly one tool: `browser_search`. It writes protocol messages only to stdout and diagnostics to stderr.

## GPT / agent integration

Use either the built-in MCP stdio server or the HTTP endpoint as a single `browser_search` tool. Keep OpenAI's own web search as a separate source. The caller should merge by canonical URL and preserve `source=google-browser` so provenance is never lost.

Recommended orchestration:

1. Run native/OpenAI web search.
2. Optionally run this browser search when Google-specific discovery is justified.
3. Stop if this service returns `CONSENT_REQUIRED` or `GOOGLE_BLOCKED`.
4. Deduplicate URLs.
5. Open/verify selected sources through the agent's normal web-fetch capability.
6. Keep provider provenance in the final evidence set.

## Tests

```bash
npm test
npm run self-check
npm run browser-smoke
```

The browser smoke test launches local Chromium but does not contact Google. Unit tests intentionally do not send live Google queries. Live Google behavior is an external/manual runtime check because repeated automated searches can trigger blocking and are not a stable CI oracle.

## Source references checked 2026-10-02

- Playwright browser installation and browser lifecycle: https://playwright.dev/docs/browsers
- Playwright package: https://www.npmjs.com/package/playwright
- MCP TypeScript server SDK: https://github.com/modelcontextprotocol/typescript-sdk/tree/main/packages/server
- Google unusual/automated traffic guidance: https://support.google.com/websearch/answer/86640
- Google Terms: https://policies.google.com/terms
