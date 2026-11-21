# Webactueel Cloud Browser — private prototype

This is an isolated **proof of concept** inside the existing browser-search repository.
The existing Google search workflow, runner labels and package files stay unchanged.

## What this implements

- Chromium with Playwright, running inside a GitHub Codespace instead of the user's PC.
- An actual MCP Streamable HTTP server with browser_open and browser_action.
- An MCP Apps inline HTML widget with an address bar, image, click, type, scroll, back, refresh and fullscreen.
- A screenshot frame every two seconds (not real-time video).
- Restriction to an exact HTTPS host allowlist; requests and redirects are filtered, WebSockets and service workers are blocked, DNS destinations are checked for private IPs.
- **Private development only:** binds to 127.0.0.1 and expects a PRIVATE Codespaces forwarded port.
- Automatic private MCP server startup on Codespaces create/resume through postStartCommand; no tunnel or public port is started.

## Run in Codespaces

1. In GitHub, open the feature branch in this repo, then **Code > Codespaces > Create codespace**. Choose the smallest 2-core option.
2. The .devcontainer config installs npm packages and Playwright Chromium. Review the free Codespaces allowance before creating a machine. The postStart hook starts the local-only MCP server automatically when the Codespace starts or resumes.
3. In Codespaces Terminal, verify it is running:

       curl -fsS http://127.0.0.1:8765/health
       cd cloud-browser
       npm run verify
       npm run browser-smoke
       npm run browser-actions-smoke

   To restart the local service manually, from the repo root use `CODESPACES=true bash .devcontainer/start-cloud-browser.sh` only inside a trusted Codespace; to stop it, use `bash .devcontainer/stop-cloud-browser.sh`. Logs live in a private directory at `~/.cache/webactueel-private-browser/server.log` rather than in GitHub commits.

4. The private MCP endpoint inside the Codespace is:

       http://127.0.0.1:8765/mcp

5. Use a local MCP Inspector through the Codespaces terminal to test browser_open with https://example.com/ and browser_action. Keep port 8765 **private**.

Only example.com is allowed by default. For another authorized public host, set BROWSER_ALLOWED_HOSTS to a comma-separated exact hostname allowlist before starting. Do not add localhost, private networks, IP literals, login portals, or sites containing confidential customer information.

## ChatGPT iframe: what is implemented vs. not implemented

The MCP tools expose a real embedded widget via ui://webactueel-browser/browser.html.
Once a compatible ChatGPT connection to this private MCP endpoint has been configured, browser_open should render it inside ChatGPT and the widget calls browser_frame and browser_action through the ChatGPT bridge.

**Not deployed:** No secured ChatGPT-to-Codespaces transport is configured in this PR. Private Codespaces ports require GitHub authentication and cannot simply be entered as public ChatGPT MCP URLs. A supported Secure MCP Tunnel or a Hostinger-hosted HTTPS OAuth 2.1 MCP proxy is required for remote access. Do **not** change Codespaces port visibility to public to work around this. This code has no production-grade multi-user authentication.

No Hostinger websites, DNS, billing, or VPS were changed. No Codespace was created or started by this PR.

## Why Playwright directly instead of Steel Browser first

Steel is open source, but its default published API and debugging ports are **unauthenticated** and require additional isolation. The existing repository already uses Playwright. This prototype reuses Playwright as the browser engine, without spending free Codespaces CPU/memory on a second browser stack. Steel can be evaluated in a second isolated stage with its ports bound to loopback, after the core security and live MCP connection pass.

## Limits and security constraints

- GitHub Codespaces stops on inactivity and has free-tier quotas; this is **not an always-on, unlimited browser**.
- Session is in memory, single user, single browser, lost when Codespace stops.
- Browser content is untrusted. Never copy instructions from a website into tool parameters without review.
- No passwords, Google login, OAuth refresh tokens, financial actions, or client data in this prototype.
- URL allowlisting and DNS checks mitigate but do not eliminate all SSRF / DNS rebinding risks. Treat this as a **development-only sandbox**, not production.
- Browser clicks can perform website actions. Use only static demonstration pages until stronger permission checks and account authentication are added.
- The widget uses the currently supported window.openai compatibility bridge for a ChatGPT-specific prototype; portable MCP Apps bridge support is a future improvement.

## Acceptance before public use

1. npm run verify passes (including MCP handshake and widget resource).
2. npm run browser-smoke and npm run browser-actions-smoke pass using a local HTML fixture.
3. npm run mcp-browser-e2e passes on a test runner, including real HTTPS navigation to example.com and allowlist rejection.
4. Browser screenshot/navigation/click tested in a running Codespace.
5. Independent QA confirms network and browser isolation against redirects, popups, downloads, WebSockets, DNS rebinding and sensitive-data leakage.
6. OAuth 2.1 or a secure tunnel is configured; public port without authentication is forbidden.
7. The inline ChatGPT widget has been opened and tested in the user's actual ChatGPT environment.
8. Codespaces quota and auto-stop rules are confirmed; no paid usage is automatically enabled.

Official references:
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/build/auth
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://github.com/steel-dev/steel-browser
