# Security

This project intentionally has a small trust boundary.

- Google searches run in a fresh Playwright browser context.
- Search runs are serialized, queued within a hard limit and slowed by a cooldown.
- A Google automated-traffic/CAPTCHA signal triggers fail-closed backoff.
- No CAPTCHA solving, proxy rotation, stealth plugins or fingerprint spoofing is implemented.
- Result destinations are returned as metadata only; this process does not fetch them.
- Literal-IP, localhost/local-domain and credential-bearing result URLs are rejected.
- Browser/context cleanup runs even when a search fails.

Do not put secrets or inappropriate confidential/personal data into Google queries. Treat result titles and snippets as untrusted external discovery data.

For ChatGPT, keep the MCP server local/private and use OpenAI Secure MCP Tunnel rather than exposing a custom public endpoint.

Do not commit `.env`, cookies, browser storage, Playwright auth state, traces, HAR files or screenshots containing session data.
