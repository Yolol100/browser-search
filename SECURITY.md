# Security

The search workflow accepts requests only from issues created by the repository owner and only when the title starts with `[browser-search]`.

Issue text is treated as untrusted data. It is read from `GITHUB_EVENT_PATH` by Node.js and is never interpolated into a shell command.

Search behavior:
- fresh Playwright browser context per run;
- serialized requests and bounded queue in the search engine;
- fail-closed backoff on Google automated-traffic/CAPTCHA signals;
- no CAPTCHA solving, proxy rotation, stealth plugins or fingerprint spoofing;
- result destinations are returned as metadata only;
- literal-IP, localhost/local-domain and credential-bearing result URLs are rejected.

The GitHub workflow uses minimal permissions: repository contents read and issues write.

## Public-repository privacy

This repository is currently public. Request issue bodies, result comments and workflow metadata can therefore be visible publicly. Do not submit secrets, personal data or confidential search queries through this route unless the repository is first made private.
