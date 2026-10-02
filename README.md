# browser-search

A small local Google browser-search tool for ChatGPT/Codex workflows.

It uses Playwright + Chromium to perform one bounded Google Search and exposes the result through a single MCP tool:

`browser_search`

The intended setup is:

`ChatGPT native Search + browser_search -> verify useful sources -> answer`

## What this repository does

- opens Google Search in Chromium;
- returns normalized organic-result metadata;
- keeps Google as a separate source from ChatGPT's own web search;
- serializes requests and applies a cooldown;
- backs off after automated-traffic/CAPTCHA signals;
- stops on unresolved consent instead of bypassing it;
- exposes one read-only MCP tool plus a small CLI for testing.

It is **not** an official Google Search API and cannot guarantee unlimited access. Google may block automated traffic.

## Install

Requirements: Node.js 22+.

```bash
npm ci
npx playwright install chromium
```

Optional runtime settings are listed in `.env.example`. Load them through your shell/process environment; this project does not parse `.env` automatically.

## Test it locally

```bash
GOOGLE_CONSENT_MODE=reject npm run search -- "WordPress performance 2026" 5 nl nl
```

Arguments:

`query [limit] [language] [country]`

## Run as MCP

```bash
npm run mcp
```

The MCP server exposes exactly one tool: `browser_search`.

For ChatGPT, a local MCP server cannot be connected directly. Keep this process local and connect it through OpenAI Secure MCP Tunnel. See `docs/chatgpt.md`.

## Verify

```bash
npm run verify
npm run browser-smoke
npm run mcp-smoke
```

CI runs the same deterministic checks, installs the matching Chromium build, runs `npm audit`, launches Chromium and verifies the MCP process starts.

A live Google query is deliberately not a CI test because Google can classify automated queries as automated traffic. A CAPTCHA or unusual-traffic page is a valid fail-closed outcome, not something this project tries to bypass.

## Important boundaries

- no CAPTCHA solving;
- no proxy rotation for bypass;
- no stealth/fingerprint spoofing;
- no automated Google-block evasion;
- no crawling of result destinations inside this process;
- treat returned titles/snippets as discovery data and verify destination sources before relying on them.

## Current integration

The minimal required path is intentionally only:

1. Playwright/Chromium search engine;
2. MCP stdio server;
3. Secure MCP Tunnel for ChatGPT;
4. CLI + tests for local verification.

No HTTP API, Docker deployment layer or duplicate API schema is maintained because those are not required for this use case.

## Official references checked 2026-10-02

- OpenAI Secure MCP Tunnel: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- ChatGPT developer mode and MCP apps: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt
- Playwright browser installation: https://playwright.dev/docs/browsers
- Google automated-traffic guidance: https://support.google.com/websearch/answer/86640
- Google Terms: https://policies.google.com/terms
