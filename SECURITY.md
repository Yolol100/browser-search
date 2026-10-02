# Security

## Network exposure

The server binds to `127.0.0.1` by default. If `BROWSER_SEARCH_HOST` is changed to a non-loopback address, startup fails unless `BROWSER_SEARCH_TOKEN` is configured.

## Browser automation

The service never attempts CAPTCHA bypass, proxy rotation, stealth/fingerprint evasion, or automatic recovery from Google's automated-traffic block. A detected block returns `GOOGLE_BLOCKED` and stops the run.

## Result URLs

Only `http` and `https` result URLs are emitted. Credential-bearing URLs and obvious loopback/private literal IP targets are rejected. The service does not fetch result pages, which keeps arbitrary result-site content outside this process's trust boundary.

## Secrets

Keep bearer tokens in environment variables or a secret manager. Do not commit `.env`, tokens, cookies, browser profiles, traces, or screenshots containing session data.
