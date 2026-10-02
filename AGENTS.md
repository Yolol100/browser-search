# Agent instructions

Purpose: let an authorized agent request one bounded Google browser search through GitHub.

Canonical flow:

`GitHub issue -> browser-search workflow -> Playwright/Chromium -> issue result comment`

A valid request:
- is created by the repository owner;
- has a title starting with `[browser-search]`;
- contains either a plain query or the documented JSON request body.

Do not re-add MCP, HTTP APIs, Docker deployment or parallel invocation layers unless a concrete requirement proves this GitHub-native route insufficient.

Preserve:
- no CAPTCHA/block bypass;
- no stealth/fingerprint spoofing;
- no proxy rotation for bypass;
- bounded serialized search and post-block backoff;
- no crawling of result destinations;
- provider provenance on results;
- safe parsing from `GITHUB_EVENT_PATH` rather than interpolating issue text into shell commands.

Before release claims run CI and confirm the browser-search request workflow still exists on the default branch.
