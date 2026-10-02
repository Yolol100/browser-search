import { SearchError } from './errors.mjs';
import { dedupeResults, looksBlocked } from './results.mjs';
import { SerialCooldownGate } from './gate.mjs';

const GOOGLE_HOST_RE = /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/i;

export function isExpectedGoogleHost(hostname) {
  return GOOGLE_HOST_RE.test(String(hostname || ''));
}

export function buildGoogleSearchUrl({ query, limit, language, country }) {
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(20, Math.max(limit + 3, limit))));
  url.searchParams.set('hl', language.split('-')[0]);
  url.searchParams.set('gl', country);
  url.searchParams.set('pws', '0');
  url.searchParams.set('filter', '0');
  return url;
}

function consentButtonPattern(mode) {
  return mode === 'accept'
    ? /accept all|alles accepteren|accepter tout|alle akzeptieren/i
    : /reject all|alles weigeren|tout refuser|alle ablehnen/i;
}

async function handleConsent(page, mode, timeoutMs) {
  const body = await page.locator('body').innerText().catch(() => '');
  const consentPage = page.url().includes('consent.google.') || /before you continue|voordat je doorgaat/i.test(body);
  if (!consentPage) return;
  if (mode === 'manual') {
    throw new SearchError('CONSENT_REQUIRED', 'Google consent requires an explicit configured choice.', 409, {
      action: 'Set GOOGLE_CONSENT_MODE=accept or reject after choosing your preferred consent mode.'
    });
  }
  const button = page.getByRole('button', { name: consentButtonPattern(mode) }).first();
  if (!(await button.isVisible().catch(() => false))) {
    throw new SearchError('CONSENT_UNRESOLVED', 'Google consent page was detected but the configured choice could not be applied.', 409);
  }
  await button.click();
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs }).catch(() => undefined);
}

async function extractResults(page) {
  return page.locator('a:has(h3)').evaluateAll((anchors) => anchors.map((anchor) => {
    const title = anchor.querySelector('h3')?.textContent?.trim() || '';
    const href = anchor.href || '';
    if (!title || !href) return null;
    const block = anchor.closest('div.MjjYud') || anchor.closest('[data-snhf]') || anchor.parentElement?.parentElement?.parentElement || anchor.parentElement;
    const lines = (block?.innerText || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
    let host = '';
    try { host = new URL(href).hostname; } catch {}
    const snippet = lines.filter(line => line !== title && (!host || !line.includes(host))).slice(0, 4).join(' ');
    return { title, url: href, snippet };
  }).filter(Boolean));
}

export class GoogleBrowserSearch {
  constructor(config) {
    this.config = config;
    this.gate = new SerialCooldownGate(config.cooldownMs, config.maxQueue);
    this.blockedUntil = 0;
  }

  async search({ query, limit, language, country }) {
    if (Date.now() < this.blockedUntil) {
      throw new SearchError('GOOGLE_BACKOFF', 'Google browser search is in backoff after an automated-traffic block.', 429, {
        retryAfterMs: this.blockedUntil - Date.now()
      });
    }

    return this.gate.run(async () => {
      const startedAt = Date.now();
      let playwright;
      try {
        playwright = await import('playwright');
      } catch {
        throw new SearchError('PLAYWRIGHT_MISSING', 'Playwright is not installed. Run npm install and npx playwright install chromium.', 503);
      }

      let browser;
      try {
        browser = await playwright.chromium.launch({ headless: this.config.headless });
      } catch (error) {
        throw new SearchError('BROWSER_LAUNCH_FAILED', 'Chromium could not be launched.', 503, { reason: String(error?.message || error).slice(0, 400) });
      }

      const locale = language.includes('-') ? language : `${language}-${country.toUpperCase()}`;
      const context = await browser.newContext({ locale });
      const page = await context.newPage();
      try {
        await page.route('**/*', async route => {
          const type = route.request().resourceType();
          if (['image', 'media', 'font'].includes(type)) return route.abort();
          return route.continue();
        });

        const url = buildGoogleSearchUrl({ query, limit, language, country });
        await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: this.config.navigationTimeoutMs });
        await handleConsent(page, this.config.consentMode, this.config.navigationTimeoutMs);

        const currentUrl = page.url();
        let currentHost = '';
        try { currentHost = new URL(currentUrl).hostname; } catch {}
        const bodyText = await page.locator('body').innerText().catch(() => '');
        if (looksBlocked(bodyText, currentUrl)) {
          this.blockedUntil = Date.now() + this.config.blockBackoffMs;
          throw new SearchError('GOOGLE_BLOCKED', 'Google reported automated or unusual traffic. No bypass was attempted.', 429, {
            retryAfterMs: this.config.blockBackoffMs,
            action: 'Stop automated Google requests and retry later manually.'
          });
        }
        if (!isExpectedGoogleHost(currentHost)) {
          throw new SearchError('UNEXPECTED_NAVIGATION', 'Search left the expected Google domain before result extraction.', 502, { url: currentUrl });
        }

        await page.locator('a:has(h3)').first().waitFor({ state: 'attached', timeout: this.config.resultTimeoutMs }).catch(() => undefined);
        const results = dedupeResults(await extractResults(page), limit);
        if (!results.length) {
          throw new SearchError('NO_RESULTS_PARSED', 'No Google result blocks could be parsed. The page layout may have changed or access may be restricted.', 502);
        }
        return {
          provider: 'google-browser',
          query,
          count: results.length,
          results,
          meta: {
            country,
            language,
            durationMs: Date.now() - startedAt,
            headless: this.config.headless,
            consentMode: this.config.consentMode
          }
        };
      } finally {
        await context.close().catch(() => undefined);
        await browser.close().catch(() => undefined);
      }
    });
  }
}
