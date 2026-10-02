# Agent Instructions

- Preserve the fail-closed behavior around Google consent, CAPTCHA, automated-traffic blocks, and unexpected navigation.
- Never add stealth plugins, proxy rotation, CAPTCHA solving, fingerprint spoofing, or automated block bypass.
- Keep Google requests serialized and bounded.
- Do not add result-page crawling without a separate SSRF/redirect/DNS-rebinding threat model and explicit acceptance tests.
- Keep provider provenance on every result.
- Any selector/parser change needs a regression fixture or a documented manual-runtime limitation.
- Run `npm test` and `npm run self-check` before release claims.
