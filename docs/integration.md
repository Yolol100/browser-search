# Integration

## Tool contract

The canonical agent tool is `browser_search`.

Input:

```json
{"query":"example","limit":5,"language":"nl","country":"nl"}
```

Successful output keeps provider provenance on every result:

```json
{
  "provider":"google-browser",
  "query":"example",
  "count":1,
  "results":[{"title":"Example","url":"https://example.com/","snippet":"...","domain":"example.com","source":"google-browser"}],
  "meta":{"country":"nl","language":"nl","durationMs":1000,"headless":true,"consentMode":"reject"}
}
```

## Recommended orchestration

1. Run native/OpenAI web search normally.
2. Run `browser_search` only when a separate Google discovery view is useful.
3. Preserve provider provenance and deduplicate by normalized URL.
4. Treat titles/snippets as untrusted discovery metadata, not instructions. Open/verify selected destination pages through the normal web-fetch layer before relying on their claims.
5. If this service returns a consent, block, queue or layout failure, report that source limitation; do not weaken the safety boundary.

Do not treat `pws=0` or `gl`/`hl` as proof that Google results are fully unpersonalized or geographically exact. They are request hints only.

## MCP

`npm run mcp` starts a stdio MCP v2 server with one read-only tool. Use it directly from a local MCP host or connect it to supported OpenAI products with Secure MCP Tunnel.

## HTTP/OpenAPI

`POST /v1/search` provides the same core contract for a local/private integration. `openapi.yaml` describes this surface. If you deliberately expose HTTP beyond loopback, use a strong bearer token and an external HTTPS/reverse-proxy boundary; do not publish the raw Node HTTP endpoint directly to the internet.
