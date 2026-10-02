# Security

## Network exposure

The server binds to `127.0.0.1` by default. A non-loopback bind is rejected unless `BROWSER_SEARCH_TOKEN` contains at least 24 characters. Bearer-token comparison uses constant-time equality.

Prefer stdio MCP + Secure MCP Tunnel for ChatGPT rather than exposing the HTTP server publicly. If HTTP must cross a host boundary, terminate TLS, authentication and network policy at a trusted reverse proxy/service boundary.

## Request/resource bounds

Search input, request-body size, queue depth, result count, HTTP timeouts and browser navigation/result waits are bounded. Google searches are serialized and provider blocks trigger local backoff.

## Browser automation

The service never attempts CAPTCHA bypass, proxy rotation, stealth/fingerprint evasion or automatic recovery from Google's automated-traffic block. A detected block returns `GOOGLE_BLOCKED`; queued requests recheck backoff before launch.

Each run owns a fresh browser context. Context/browser resources are closed in `finally`, including partial startup failures.

## Result URLs

Only `http` and `https` result URLs are emitted. Credential-bearing URLs, local hostnames and literal IP targets are rejected. The service does not fetch result pages, keeping arbitrary destination content outside this process's trust boundary.

## Secrets and browser state

Keep bearer tokens and tunnel credentials in environment variables or a secret manager. Do not commit `.env`, cookies, storage state, Playwright auth state, traces, HAR files or screenshots containing session data.
