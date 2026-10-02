# Verification and audit scenarios

## Deterministic source/runtime checks

The automated suite covers independent failure classes rather than parameter-count inflation:

1. valid search request/defaults;
2. empty/oversized/unknown request fields;
3. invalid limit/language/country;
4. credential, literal-IP, local and non-HTTP result URLs;
5. Google `/url` result redirect unwrapping without treating ad redirectors as organic targets;
6. tracking cleanup and deterministic deduplication;
7. English/Dutch automated-traffic block detection;
8. non-loopback token configuration;
9. serialized execution and bounded queue;
10. locale/country Google request construction and hostile Google-lookalike hostname rejection;
11. provider backoff before browser launch;
12. unexpected-error sanitization;
13. constant-time bearer-token comparison;
14. HTTP authorization and content-type enforcement;
15. no-store/request-id/nosniff response headers;
16. browser executable readiness;
17. Node syntax validation and required-file/dependency-pin self-check.

## Browser controlled-runtime check

`npm run browser-smoke` launches the installed Chromium binary, renders local HTML, verifies output and closes it. This proves the local browser runtime, not Google access.

## CI

CI must use the committed `package-lock.json` with `npm ci`, install the matching Playwright Chromium binary, run browser-smoke, deterministic verification and CLI help. GitHub Actions dependencies are pinned to verified full commit SHAs.

## Manual/external provider scenario

A live Google query is not a stable CI oracle. Run at most a bounded manual verification when needed:

- expected outcome A: organic results with provider provenance;
- expected outcome B: consent boundary -> fail closed;
- expected outcome C: unusual traffic/CAPTCHA -> `GOOGLE_BLOCKED`, no bypass;
- expected outcome D: selector/layout drift -> `NO_RESULTS_PARSED`, manual inspection required.

A live block is a valid provider-state observation, not a reason to weaken controls.
