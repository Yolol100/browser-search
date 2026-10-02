# Verification layers

## Deterministic source/runtime checks

- Node syntax checks for every `.mjs` source file.
- Unit tests for request bounds, URL safety, normalization/deduplication, Google block detection, and non-loopback authentication configuration.
- Self-check for required repository files.

## Browser runtime check

CI installs Playwright Chromium and runs `npm run browser-smoke`. This launches Chromium, renders local HTML, verifies the page title, and closes the browser deterministically.

## Intentionally manual/external

A live Google query is not a CI oracle. Google documents automated queries as automated traffic and may block them. Live Google verification must therefore remain a bounded manual/external runtime check. A block is a valid provider result and must never trigger bypass logic.
