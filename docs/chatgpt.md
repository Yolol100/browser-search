# ChatGPT usage without MCP

The repository can be used through GitHub itself when the ChatGPT environment has permission to create and read GitHub issues.

## Request

Create an issue in `Yolol100/browser-search`.

Title:

`[browser-search] <short description>`

Body, either:

```text
site:nu.nl technologie
```

or:

```json
{"query":"site:nu.nl technologie","limit":5,"language":"nl","country":"nl"}
```

## Execution

GitHub Actions reacts to an owner-created issue with that title prefix, checks out the repository, installs the pinned dependencies and Chromium, and runs `scripts/github-search-request.mjs`.

The search result or fail-closed provider error is posted as an issue comment. The request issue is then closed.

## ChatGPT readback

After creating the issue, retrieve its comments. Look for:

`<!-- browser-search-result:v1 -->`

Parse the JSON result and use the returned URLs as discovery candidates. Verify useful destination pages separately before making factual claims.

## Important limitation

OpenAI's standard GitHub app is documented primarily as repository content access and may be read-only depending on the product surface. This workflow requires a ChatGPT/Codex/connector surface that can create an issue. In the current connected GitHub toolset, issue creation and comment readback are available.

The repository itself is currently public, so request issues are public. Do not use it for sensitive search queries unless the repository visibility is changed to private.
