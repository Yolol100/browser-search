# browser-search

A small Google browser-search runner that ChatGPT can invoke through GitHub, without MCP.

Canonical flow:

`ChatGPT -> GitHub issue -> self-hosted GitHub Actions runner -> Playwright/Chromium -> Google -> issue comment -> ChatGPT`

## Free ChatGPT browser capabilities (verified 20 November 2026)

This repository is **not required** for every browser research task. Use the least powerful, already-authorized tool that can provide the required evidence:

| Task | First choice | What it proves |
| --- | --- | --- |
| Public facts and documentation | ChatGPT native web search | Public text, **not** interactive browsing |
| Read an already open, paired tab in normal Chat | Browser connector `list_tabs` + `get_tab_context` | Read-only page text; no clicks or navigation |
| Verify local Chrome works | Desktop Commander + isolated headless Chrome on a **fixed harmless test page** | Chrome smoke-test only, not safe arbitrary-site browsing |
| Authorized public page requiring rendered-browser inspection | Guarded Desktop Commander + Playwright inspector after readiness checks | Scoped read-only browser evidence |
| Click, fill, submit, use a logged-in session | Separately approved/tested interactive adapter | Only the exact verified interaction class |

The isolated Chrome smoke for `https://example.com` succeeded on the owner's MSI on 20 November 2026, but Playwright and the self-hosted GitHub Actions runner were **not ready** on that machine. Do not treat a historical test as current readiness. No additional browser API key or cloud-browser credits are needed for native search, paired tab reading or that local smoke, assuming the connected tools/device remain available.

**Security:** do not run arbitrary URLs with an unrestricted headless Chrome command or use its success as evidence of DNS/redirect/subresource protection. Use a hardened, target-authorized inspector for real arbitrary public sites. Do not send private client queries, secrets, profiles or cookies through public GitHub issues. This repository's public self-hosted runner is **not** a default execution option: GitHub warns against public-repo self-hosted runners. Prefer the existing ChatGPT read paths until a properly secured, owner-controlled runner and its workflow have been independently verified. Do not bypass CAPTCHAs or source access denials.

## Why a self-hosted runner

A GitHub repository stores code; GitHub Actions executes it. A real test using a GitHub-hosted runner successfully triggered this repository from ChatGPT, but Google blocked the cloud-runner IP as automated traffic.

The search workflow therefore targets a self-hosted runner labeled `browser-search`. This executes Chromium from your own machine/network while ChatGPT still uses GitHub as the request/response channel.

## ChatGPT request

Create an issue whose title starts with `[browser-search]`.

Body can be a plain query or:

```json
{"query":"site:nu.nl technologie","limit":5,"language":"nl","country":"nl"}
```

Only owner-created request issues execute. The runner posts the result as an issue comment and closes the issue.

## One-time runner setup

In this repository open `Settings -> Actions -> Runners -> New self-hosted runner`.

Install the GitHub runner on the machine that should execute searches and add the custom label `browser-search`.

See `docs/chatgpt.md`.

## Local verification

```bash
npm ci
npx playwright install chromium
npm run verify
npm run browser-smoke
```

Manual query:

```bash
GOOGLE_CONSENT_MODE=reject npm run search -- "site:nu.nl technologie" 5 nl nl
```

## Boundaries

- no CAPTCHA solving or bypass;
- no proxy rotation for bypass;
- no stealth/fingerprint spoofing;
- Google blocks fail closed;
- search requests are serialized at workflow level;
- destination pages are not crawled by this process;
- returned snippets are discovery data and must be verified at destination sources.

## Privacy

The repository is currently public, so request issues and result comments are public. Make the repository private before using confidential or personal search queries.

## Official references checked 2026-10-02

- GitHub self-hosted runners: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners
- GitHub runner labels: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow
- GitHub issue-triggered Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Playwright browsers: https://playwright.dev/docs/browsers
- Google automated traffic guidance: https://support.google.com/websearch/answer/86640
