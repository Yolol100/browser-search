# Architecture

## Components

- `src/config.mjs` — fail-closed runtime configuration.
- `src/google-browser.mjs` — Playwright browser lifecycle, consent boundary, block detection and result extraction.
- `src/gate.mjs` — serialized execution, cooldown and bounded queue.
- `src/validation.mjs` — request bounds and outbound result-URL validation.
- `src/results.mjs` — Google redirect unwrapping, tracking cleanup and deterministic deduplication.
- `src/service.mjs` — common search/readiness service.
- `src/http-app.mjs` — local JSON API with authentication, body bounds, timeouts and security headers.
- `src/server.mjs` — HTTP lifecycle and graceful shutdown.
- `src/cli.mjs` — direct command-line interface.
- `src/mcp-server.mjs` — stdio MCP tool for local hosts and Secure MCP Tunnel.

## Trust boundaries

The browser is allowed to navigate to Google Search. Result destinations are treated as untrusted metadata and are never fetched by this service. Opening and verifying selected result pages belongs to the calling agent's normal web-retrieval layer.

The HTTP API is loopback-only by default. Non-loopback binding requires a bearer token. For ChatGPT, prefer Secure MCP Tunnel over exposing this HTTP API publicly.

## Concurrency and provider pressure

Google runs are serialized. The queue is bounded and each run respects a minimum start interval. If Google returns an automated/unusual-traffic signal, the service enters a configurable backoff. Queued work rechecks the backoff immediately before browser launch so stale queued requests cannot ignore a newly detected provider block.

## Browser lifecycle

Every search owns one browser context. Context and browser cleanup run in `finally`, including partial-startup failures. Browser contexts provide isolated per-search storage rather than reusing login/cookie state.

## Failure behavior

- `QUEUE_FULL` — local bounded queue is full.
- `CONSENT_REQUIRED` / `CONSENT_UNRESOLVED` — explicit consent handling is required or could not be applied.
- `GOOGLE_BLOCKED` / `GOOGLE_BACKOFF` — automated-traffic signal or active local backoff; stop and do not bypass.
- `GOOGLE_NAVIGATION_FAILED` — Google could not be loaded inside the configured navigation boundary.
- `NO_RESULTS_PARSED` — selectors produced no usable organic-result blocks; treat as access/layout drift, not proof of zero results.
- `UNEXPECTED_NAVIGATION` — navigation left the accepted Google hostname family.
- `PLAYWRIGHT_MISSING` / `BROWSER_LAUNCH_FAILED` — local runtime is not ready.
