# ChatGPT usage without MCP

The no-MCP route is:

`ChatGPT -> GitHub issue -> self-hosted GitHub Actions runner -> Playwright/Google -> issue comment -> ChatGPT`

## Why self-hosted

The GitHub-hosted-runner proof successfully received a ChatGPT-created issue and executed this repository, but Google returned `GOOGLE_BLOCKED` for the cloud runner IP. A self-hosted runner executes the same repository on your own machine/network instead.

## Before choosing the GitHub runner

Use normal ChatGPT web search for public text. For an already open paired browser tab, Chat's Browser connector can read the tab without clicking. For an explicitly authorized local MSI smoke, Desktop Commander can launch an isolated, fixed-page Chrome headless test; that is **not** general website inspection or browser interaction. For approved public browser-render evidence use the existing guarded Playwright inspector only after local installation, host authorization, `probe=READY` and same-run readback.

A **public** repository combined with a self-hosted Actions runner creates an unnecessary attack surface. Do not configure the runner for unattended use on the owner's primary Windows computer until the repo visibility, GitHub event trust boundaries, isolation, labels, network reach and secret exposure risks are independently reviewed. Do not add account/API credentials to repository issues. Existing Chrome/session permissions do not carry over to the isolated runner. The workflow in this repository still requires a runner label `browser-search`; its presence is not assumed.

No GitHub issue or Actions run should be created merely to test the no-credit ChatGPT text/tab-read routes. If a self-hosted workflow is eventually used, record exact issue ID, runner identity, workflow/run ID, source and result and verify the destination evidence separately.

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
