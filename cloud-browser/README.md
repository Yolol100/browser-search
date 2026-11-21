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

## Run in Codespaces

1. In GitHub, open the feature branch in this repo, then **Code > Codespaces > Create codespace**. Choose the smallest 2-core option.
2. The .devcontainer config runs npm install and installs Playwright Chromium. Review the free Codespaces allowance before creating a machine; there is no guarantee of unlimited free usage.
3. In Codespaces Terminal:

       cd cloud-browser
       npm run verify
       npm start

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

1. npm run verify passes.
2. Browser screenshot/navigation/click tested in a running Codespace.
3. Independent QA confirms network and browser isolation against redirects, popups, downloads, WebSockets, DNS rebinding and sensitive-data leakage.
4. OAuth 2.1 or a secure tunnel is configured; public port without authentication is forbidden.
5. The inline ChatGPT widget has been opened and tested in the user's actual ChatGPT environment.
6. Codespaces quota and auto-stop rules are confirmed; no paid usage is automatically enabled.

Official references:
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/build/auth
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://github.com/steel-dev/steel-browser
