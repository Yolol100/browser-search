# Webactueel Cloud Browser: Codespaces en ChatGPT

Status: prototype op draft PR #12. Geen live Codespace, tunnel, Hostinger-wijziging of ChatGPT-plugin geactiveerd.

## Exacte configuratie

| Eigenschap | Waarde |
|---|---|
| GitHub-branch | feature/codespaces-mcp-browser-prototype-20261121 |
| Codespaces-container | .devcontainer/devcontainer.json; Node 22, installatie Chromium |
| Werkmap | cloud-browser |
| Start | npm start (node src/server.mjs) |
| BROWSER_BIND | 127.0.0.1, bind naar publieke interfaces wordt geweigerd |
| PORT | 8765 |
| BROWSER_ALLOWED_HOSTS | example.com standaard; exacte HTTPS-hosts, maximaal acht |
| MCP-protocol en URL | Streamable HTTP op http://127.0.0.1:8765/mcp |
| Lokale healthcheck | http://127.0.0.1:8765/health |
| MCP-tools | browser_open, browser_action, browser_frame |
| MCP Apps HTML | ui://webactueel-browser/browser.html |

## Handmatig een Codespace aanmaken

1. Open https://github.com/Yolol100/browser-search/tree/feature/codespaces-mcp-browser-prototype-20261121 .
2. Klik Code > Codespaces > Create codespace on this branch, kies 2 cores indien beschikbaar.
3. Controleer gratis resterende quota en je GitHub-budgetlimiet voor kosten.
4. De postCreateCommand installeert npm-pakketten en Playwright Chromium. Start vervolgens in de Codespaces-terminal:

       cd cloud-browser
       npm run verify
       npm run browser-smoke
       npm run browser-actions-smoke
       npm start

5. Open een tweede terminal en controleer:

       curl -fsS http://127.0.0.1:8765/health

   Verwacht: {"status":"ok","private":true}.
6. Controleer in tab Ports dat poort 8765 de zichtbaarheid PRIVATE heeft. Maak deze nooit PUBLIC.

## MCP endpoint en Codespaces-URL

Binnen de Codespace is het echte MCP endpoint http://127.0.0.1:8765/mcp.

De verwachte externe GitHub-portforward-URL heeft deze vorm:

    https://<CODESPACE_NAME>-8765.app.github.dev/mcp

De echte CODESPACE_NAME ontstaat pas bij het maken van de Codespace. De URL is uitsluitend via GitHub-authenticatie bereikbaar zolang de poort PRIVATE blijft. Dat is veilig, maar ChatGPT kan hem daardoor niet rechtstreeks als publieke MCP-server gebruiken.

Deze PR bevat geen gedeployde HTTPS/OAuth-proxy en geen runtime-token. Er zijn geen geheimen ingesteld of in broncode geplaatst.

## Handmatige ChatGPT-koppeling, twee routes

**Route A: OpenAI Secure MCP Tunnel, privé zonder publieke Codespaces-poort.**

Deze route vraagt een tunnel-id en een OpenAI Platform runtime-API-key, plus toegang en permissies in zowel OpenAI Platform als de ChatGPT-werkruimte. Dat conflicteert met de eerdere eis van geen API-sleutel. Er is daarom geen tunnel of sleutel aangemaakt.

Als de gebruiker deze route expliciet kiest:
1. Maak of selecteer de tunnel via de officiële Platform-tunnelinstellingen.
2. Download de officiële tunnel-client in de Codespace (zie bron hieronder).
3. Voer tunnel-client help quickstart uit en configureer de lokale MCP-target http://127.0.0.1:8765/mcp en de toegewezen tunnel-id. Laat de sleutel alleen via veilige secret-invoer instellen.
4. Controleer tunnel-client doctor --profile <profile> --explain, daarna tunnel-client run --profile <profile>.
5. In ChatGPT op het web: Plugins > Add custom MCP server > Connection: Tunnel. Selecteer de tunnel, stel beveiliging in en test browser_open voor https://example.com/.
6. Houd tunnel-client en de Codespace actief gedurende de sessie. Koppel nooit een publieke, ongeauthenticeerde Codespaces-poort.

**Route B: Hostinger OAuth 2.1 MCP-proxy zonder OpenAI Platform-API-key.**

Vereist een nieuwe, goed beveiligde HTTPS-proxy met gebruikersauthenticatie en outbound Codespaces-koppeling. Dit is NIET gebouwd of geactiveerd. Hostinger is nadrukkelijk niet gewijzigd.

## Limieten en veiligheidsgrenzen

- GitHub Free persoonlijke accounts bevatten 120 core-uren en 15 GB-maand Codespaces-opslag per maand. Twee cores betekenen circa 60 actieve uren bij geen ander gebruik.
- Standaard stopt Codespaces na 30 minuten inactiviteit; timeout kan 5–240 minuten zijn. Elke draaiende sessie stopt uiterlijk na 12 uur, ongeacht activiteit.
- Geen Codespace automatisch vanuit ChatGPT starten: hiervoor ontbreekt nog een aparte, beveiligde on-demand-startintegratie.
- Websiteallowlist: alleen exacte HTTPS-domeinen. URL-blokkade, DNS-check, privéadresblokkade, uitgeschakelde WebSockets, beperkte browserrechten.
- DNS-check blokkeert veel SSRF-routes maar sluit DNS-rebinding/TOCTOU niet volledig uit. Behandel dit als ontwikkelprototype, niet als productie-browser.
- Geen Google-login, OAuth-tokens, wachtwoorden, betaalacties of klantdata invoeren.
- PR #12 blijft een draft totdat Codespaces-start, tunnel, echte browserbesturing en de iframe-widget binnen ChatGPT zijn geverifieerd.

## Bronnen

- https://docs.github.com/en/codespaces/reference/security-in-github-codespaces
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
- https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle
- https://developers.openai.com/api/docs/guides/custom-mcp-server
- https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
