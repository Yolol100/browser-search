# Contributing

Keep changes small and evidence-bound.

Before proposing a change:

1. Add or update a regression test for deterministic logic.
2. Preserve the no-bypass policy in `docs/policy.md`.
3. Run `npm test` and `npm run self-check`.
4. Treat live Google behavior as an external/manual runtime check, never as a stable CI oracle.
5. Do not broaden the service into general result-page crawling without a separate threat model.
