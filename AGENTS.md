# Agent instructions

Keep this repository focused on one purpose: provide a local Google browser-search tool to agents through MCP.

Required architecture:

`Playwright/Chromium -> SearchService -> browser_search MCP tool`

Keep the CLI only as a local diagnostic path.

Do not re-add HTTP APIs, OpenAPI schemas, Docker deployment or parallel integration layers unless a concrete requirement appears that cannot be met by MCP + Secure MCP Tunnel.

Preserve these boundaries:

- no CAPTCHA/bot-block bypass;
- no stealth/fingerprint spoofing;
- no proxy rotation for bypass;
- bounded serialized search and post-block backoff;
- destination pages are not crawled here;
- provider provenance remains on every result;
- selector/parser changes require a deterministic regression test where possible.

Before release claims run:

```bash
npm run verify
npm run browser-smoke
npm run mcp-smoke
```
