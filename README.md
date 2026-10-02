# Webactueel Browser Search

A bounded Google browser-search bridge for ChatGPT, Codex and other agent workflows. It opens Google Search with Playwright/Chromium, returns normalized organic-result metadata and stops on consent ambiguity, CAPTCHA, automated-traffic blocks, unexpected navigation or local queue pressure.

## Intended use

`OpenAI/ChatGPT Search + browser-search -> dedupe/compare -> verify selected sources -> final answer`

This project is an additional discovery source, not an official Google API and not an unlimited-search guarantee. Google can classify programmatic queries as automated traffic and block them.

## Safety boundaries

- No CAPTCHA solving or bypass.
- No proxy rotation, stealth plugins, fingerprint spoofing or block evasion.
- Serialized Google runs with cooldown, bounded queue and post-block backoff.
- Result destinations are not crawled by this service.
- Result URLs are normalized and literal-IP/local targets are rejected.
- Loopback HTTP by default; non-loopback binding requires a bearer token of at least 24 characters.
- Consent defaults to `manual`; `accept` or `reject` must be chosen explicitly.

## Runtime

- Node.js 22+
- Playwright 1.63.0
- Chromium installed through Playwright
- MCP Server SDK 2.2.0

## Install

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

The service does not parse `.env` itself. Load variables through your shell, container runtime or process manager.

## CLI

```bash
GOOGLE_CONSENT_MODE=reject npm run search -- "WordPress performance 2026" 5 nl nl
```

Arguments are `query [limit] [language] [country]`.

## Local HTTP API

```bash
npm start
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/ready
curl -s -X POST http://127.0.0.1:8787/v1/search \
  -H 'content-type: application/json' \
  -d '{"query":"WordPress performance 2026","limit":5,"language":"nl","country":"nl"}'
```

See `openapi.yaml` and `schemas/` for the machine-readable contracts.

## MCP

```bash
npm run mcp
```

The stdio MCP server exposes one read-only tool: `browser_search`.

For ChatGPT, a local MCP server cannot be connected directly. Keep this server private and connect the stdio command through OpenAI Secure MCP Tunnel. See `docs/chatgpt.md`.

## Docker

```bash
export BROWSER_SEARCH_TOKEN='replace-with-at-least-24-random-characters'
docker compose up --build
```

The Compose port is published only on `127.0.0.1` by default. The container runs as a non-root user and uses an init process plus increased shared memory for Chromium.

## Verification

```bash
npm run verify
npm run browser-smoke
```

The deterministic suite covers input bounds, URL safety, Google redirect normalization, block detection, queue serialization, backoff, auth, HTTP boundaries, security headers and provider provenance. `browser-smoke` launches Chromium against local HTML only.

A live Google query is deliberately not a CI oracle. Google may block automated traffic, so a live query is a bounded manual/external runtime check. `GOOGLE_BLOCKED` is a valid fail-closed outcome and never triggers bypass logic.

## Documentation

- `docs/architecture.md` — components, trust boundaries and failure model.
- `docs/chatgpt.md` — ChatGPT/OpenAI integration using Secure MCP Tunnel.
- `docs/integration.md` — tool contract and orchestration.
- `docs/operations.md` — deployment/runbook and failure handling.
- `docs/policy.md` — Google automation boundary.
- `docs/verification.md` — evidence layers and scenario matrix.

## Sources reviewed 2026-10-02

- Playwright browser/Docker guidance: https://playwright.dev/docs/browsers and https://playwright.dev/docs/docker
- MCP / Secure MCP Tunnel: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- ChatGPT developer mode/MCP apps: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt
- Google automated traffic guidance: https://support.google.com/websearch/answer/86640
- Google Terms: https://policies.google.com/terms
