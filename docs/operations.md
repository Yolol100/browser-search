# Operations runbook

## Startup gate

Before enabling the service:

1. `npm ci`
2. `npx playwright install chromium`
3. `npm run verify`
4. `npm run browser-smoke`
5. `GET /ready` returns HTTP 200
6. choose `GOOGLE_CONSENT_MODE` explicitly for the environment

## Recommended defaults

- `BROWSER_SEARCH_HOST=127.0.0.1`
- `BROWSER_SEARCH_MAX_QUEUE=8`
- `GOOGLE_COOLDOWN_MS=12000`
- `GOOGLE_BLOCK_BACKOFF_MS=900000`
- `GOOGLE_MAX_RESULTS=10`

Increase throughput only after evidence. Parallel Google browser searches are intentionally unsupported.

## Failure handling

- `QUEUE_FULL`: caller retries later with bounded backoff; do not create an unbounded upstream retry queue.
- `GOOGLE_BLOCKED`: stop automated Google calls. Do not solve or automate reCAPTCHA, rotate proxies, spoof fingerprints or use stealth plugins.
- `GOOGLE_BACKOFF`: respect `retryAfterMs`.
- `CONSENT_REQUIRED`: choose consent mode explicitly; never make a silent choice in code.
- `NO_RESULTS_PARSED`: inspect manually for Google layout/access drift before changing selectors.
- `BROWSER_LAUNCH_FAILED`: run browser-smoke and verify matching Playwright browser binaries.

## Logging/privacy

Do not log tokens, cookies, persistent browser storage or full sensitive queries. The service currently logs only startup diagnostics unless the caller captures its JSON responses.

## Upgrades

When updating Playwright, update the package and browser binary together. Re-run source tests, browser smoke and one bounded manual external query before claiming live compatibility.
