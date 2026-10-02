# ChatGPT usage without MCP

The no-MCP route is:

`ChatGPT -> GitHub issue -> self-hosted GitHub Actions runner -> Playwright/Google -> issue comment -> ChatGPT`

## Why self-hosted

The GitHub-hosted-runner proof successfully received a ChatGPT-created issue and executed this repository, but Google returned `GOOGLE_BLOCKED` for the cloud runner IP. A self-hosted runner executes the same repository on your own machine/network instead.

## One-time setup

Open `Yolol100/browser-search` and go to `Settings -> Actions -> Runners -> New self-hosted runner`.

Choose the operating system and architecture of the machine that should run browser searches. Follow GitHub's generated install/config commands and add the custom label `browser-search`.

Keep that runner online when you want ChatGPT-triggered searches to work.

GitHub recommends extra care with self-hosted runners on public repositories. This repository is currently public, and request issues are public. Making the repository private is recommended.

## Request from ChatGPT

Create an issue:

Title: `[browser-search] <short description>`

Body:

```json
{"query":"site:nu.nl technologie","limit":5,"language":"nl","country":"nl"}
```

The workflow accepts only owner-created request issues.

## Result

The runner executes Chromium and posts one comment beginning with `<!-- browser-search-result:v1 -->`. ChatGPT reads that comment and verifies useful destination pages separately.

No MCP tool, public API or tunnel is involved.
