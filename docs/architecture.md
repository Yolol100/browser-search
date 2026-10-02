# Architecture

## Components

- `src/google-browser.mjs`: owns the Playwright browser lifecycle and Google result extraction.
- `src/gate.mjs`: serializes runs and enforces a minimum start interval.
- `src/validation.mjs`: validates request input and emitted result URLs.
- `src/results.mjs`: strips common tracking parameters and deduplicates exact normalized URLs.
- `src/service.mjs`: small orchestration layer used by CLI and HTTP API.
- `src/server.mjs`: local JSON API.
- `src/cli.mjs`: direct command-line entry point.

## Trust boundary

The browser is allowed to load Google Search. The service returns search-result metadata but does not crawl result destinations. Result-page verification belongs to the calling agent's normal web retrieval layer.

## Failure behavior

`CONSENT_REQUIRED`: explicit consent configuration is missing.

`GOOGLE_BLOCKED`: Google reported automated/unusual traffic or CAPTCHA. Stop; do not bypass.

`NO_RESULTS_PARSED`: the page rendered but selectors produced no results. Treat as layout/access drift, not an empty-search proof.

`UNEXPECTED_NAVIGATION`: the search page left the expected Google domain before extraction.
