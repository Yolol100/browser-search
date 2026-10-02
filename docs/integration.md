# Integration

## Tool contract

Expose `POST /v1/search` as an agent tool named `browser_search`.

Input:

```json
{"query":"example","limit":5,"language":"nl"}
```

Successful output preserves provider provenance:

```json
{
  "provider":"google-browser",
  "query":"example",
  "count":1,
  "results":[{"title":"Example","url":"https://example.com/","snippet":"...","domain":"example.com","source":"google-browser"}]
}
```

## Recommended agent rule

Use native/OpenAI web search as the primary general search capability. Use `browser_search` as an additional Google-specific discovery source, not as a guaranteed fallback. On `GOOGLE_BLOCKED`, `CONSENT_REQUIRED`, or `NO_RESULTS_PARSED`, report the provider limitation and continue only with independent sources that remain available.


## MCP

Run `npm run mcp` and configure the calling agent to launch this repository as an stdio MCP server. The server exposes one tool, `browser_search`, with the same query/limit/language contract as the HTTP API.

The MCP process must not log normal diagnostics to stdout because stdout is the protocol channel.
