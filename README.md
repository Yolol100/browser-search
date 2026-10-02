# browser-search

A small Google browser-search runner that ChatGPT can call through GitHub.

The intended flow is:

`ChatGPT -> GitHub issue -> GitHub Actions -> Playwright/Chromium -> Google -> issue comment -> ChatGPT`

No MCP server is required.

## How ChatGPT calls it

Create an issue in this repository with a title starting with:

`[browser-search]`

The issue body is either a plain search query:

```text
site:nu.nl technologie
```

or JSON:

```json
{"query":"site:nu.nl technologie","limit":5,"language":"nl","country":"nl"}
```

Only issues created by the repository owner are executed. The workflow runs the browser search, writes the result back as a comment and closes the request issue.

A ChatGPT environment with GitHub issue-write access can therefore use this repository as a search execution bridge: create the request issue, wait for the Action, read the result comment, then verify useful destination sources.

## Why GitHub Actions

A GitHub repository stores code but does not execute it by itself. GitHub Actions is the runtime. Using an issue as the request envelope means no separate MCP tunnel, hosted API or server is required.

## Install/test locally

Requirements: Node.js 22+.

```bash
npm ci
npx playwright install chromium
npm run verify
npm run browser-smoke
```

Manual local search:

```bash
GOOGLE_CONSENT_MODE=reject npm run search -- "site:nu.nl technologie" 5 nl nl
```

## Safety boundaries

- no CAPTCHA solving or bypass;
- no stealth/fingerprint spoofing;
- no proxy rotation for bypass;
- serialized searches and cooldown;
- fail-closed backoff after Google automated-traffic/CAPTCHA signals;
- result destinations are not crawled by this process;
- titles/snippets are discovery metadata and should be verified at the destination.

## Privacy warning

This repository is currently public. GitHub issues and their result comments are therefore public. Use this request route only for non-sensitive searches unless the repository is made private.

## CI

Normal CI verifies source syntax, deterministic tests, dependency audit and a real Chromium launch. The search-request workflow is separate and runs only for owner-created issues whose title starts with `[browser-search]`.

## Current official references checked 2026-10-02

- GitHub Actions issue triggers: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub CLI comments in Actions: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-github-cli
- Playwright browsers: https://playwright.dev/docs/browsers
- Google automated traffic guidance: https://support.google.com/websearch/answer/86640
