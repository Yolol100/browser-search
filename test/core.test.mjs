import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearchInput, isPublicResultUrl } from '../src/validation.mjs';
import { normalizeResultUrl, dedupeResults, looksBlocked, unwrapGoogleResultUrl } from '../src/results.mjs';
import { loadConfig } from '../src/config.mjs';
import { SerialCooldownGate } from '../src/gate.mjs';
import { buildGoogleSearchUrl, isExpectedGoogleHost, GoogleBrowserSearch } from '../src/google-browser.mjs';
import { publicError, SearchError } from '../src/errors.mjs';

function withEnv(values, fn) {
  const saved = {};
  for (const key of Object.keys(values)) {
    saved[key] = process.env[key];
    if (values[key] == null) delete process.env[key]; else process.env[key] = values[key];
  }
  try { return fn(); } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
}

test('validates bounded search inputs and defaults country', () => {
  assert.deepEqual(
    validateSearchInput({ query: 'wordpress seo', limit: 5, language: 'nl' }, 10, 'be'),
    { query: 'wordpress seo', limit: 5, language: 'nl', country: 'be' }
  );
  assert.throws(() => validateSearchInput({ query: '', limit: 5 }, 10), /query/);
  assert.throws(() => validateSearchInput({ query: 'x', limit: 11 }, 10), /limit/);
  assert.throws(() => validateSearchInput({ query: 'x', surprise: true }, 10), /Unknown request/);
  assert.throws(() => validateSearchInput({ query: 'x', country: 'nld' }, 10), /country/);
});

test('rejects literal IP, local and credential-bearing result URLs', () => {
  assert.equal(isPublicResultUrl('https://example.com/a'), true);
  assert.equal(isPublicResultUrl('http://127.0.0.1/x'), false);
  assert.equal(isPublicResultUrl('https://[::1]/x'), false);
  assert.equal(isPublicResultUrl('https://203.0.113.7/x'), false);
  assert.equal(isPublicResultUrl('https://user:pass@example.com/x'), false);
  assert.equal(isPublicResultUrl('file:///etc/passwd'), false);
});

test('unwraps Google organic redirects and excludes Google ad redirectors', () => {
  assert.equal(
    unwrapGoogleResultUrl('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1&sa=U'),
    'https://example.com/a?x=1'
  );
  assert.equal(normalizeResultUrl('https://www.google.com/aclk?foo=bar'), null);
  assert.equal(normalizeResultUrl('https://www.google.com/pagead/aclk?foo=bar'), null);
});

test('normalizes tracking params and deduplicates exact normalized URLs', () => {
  assert.equal(normalizeResultUrl('https://example.com/a?utm_source=x&z=3&b=2#part'), 'https://example.com/a?b=2&z=3');
  const results = dedupeResults([
    { title: 'A', url: 'https://example.com/a?utm_source=x&b=2', snippet: 'one' },
    { title: 'A duplicate', url: 'https://example.com/a?b=2', snippet: 'two' },
    { title: 'B', url: 'https://example.org/b', snippet: 'three' }
  ], 10);
  assert.equal(results.length, 2);
  assert.equal(results[0].source, 'google-browser');
});

test('detects Google automated-traffic block signals', () => {
  assert.equal(looksBlocked('Our systems have detected unusual traffic from your computer network', 'https://www.google.com/sorry/'), true);
  assert.equal(looksBlocked('ongebruikelijk verkeer vanaf uw computernetwerk', 'https://www.google.nl/search?q=x'), true);
  assert.equal(looksBlocked('normal results', 'https://www.google.com/search?q=x'), false);
});

test('validates consent and country configuration', () => {
  withEnv({ GOOGLE_CONSENT_MODE: 'invalid' }, () => assert.throws(() => loadConfig(), /CONSENT_MODE/));
  withEnv({ GOOGLE_CONSENT_MODE: 'manual', GOOGLE_DEFAULT_COUNTRY: 'nld' }, () => assert.throws(() => loadConfig(), /COUNTRY/));
  withEnv({ GOOGLE_CONSENT_MODE: 'reject', GOOGLE_DEFAULT_COUNTRY: 'nl' }, () => {
    const config = loadConfig();
    assert.equal(config.consentMode, 'reject');
    assert.equal(config.defaultCountry, 'nl');
  });
});

test('serial cooldown gate never overlaps tasks and bounds queue', async () => {
  const gate = new SerialCooldownGate(1, 2);
  let active = 0;
  let maxActive = 0;
  let release;
  const blocker = new Promise(resolve => { release = resolve; });
  const first = gate.run(async () => { active += 1; maxActive = Math.max(maxActive, active); await blocker; active -= 1; });
  const second = gate.run(async () => { active += 1; maxActive = Math.max(maxActive, active); active -= 1; });
  assert.throws(() => gate.run(async () => undefined), /queue is full/i);
  release();
  await Promise.all([first, second]);
  assert.equal(maxActive, 1);
});

test('builds localized depersonalized Google search URL and rejects lookalike hosts', () => {
  const url = buildGoogleSearchUrl({ query: 'wordpress seo', limit: 5, language: 'nl', country: 'be' });
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('q'), 'wordpress seo');
  assert.equal(url.searchParams.get('hl'), 'nl');
  assert.equal(url.searchParams.get('gl'), 'be');
  assert.equal(url.searchParams.get('pws'), '0');
  assert.equal(isExpectedGoogleHost('www.google.nl'), true);
  assert.equal(isExpectedGoogleHost('google.evil.example'), false);
});

test('block backoff fails closed before opening another browser', async () => {
  const search = new GoogleBrowserSearch({ cooldownMs: 1, maxQueue: 1, blockBackoffMs: 60000 });
  search.blockedUntil = Date.now() + 5000;
  await assert.rejects(() => search.search({ query: 'x', limit: 1, language: 'nl', country: 'nl' }), error => error.code === 'GOOGLE_BACKOFF');
});

test('public errors hide unexpected internal messages', () => {
  assert.deepEqual(publicError(new SearchError('KNOWN', 'Known', 400)), { error: { code: 'KNOWN', message: 'Known', details: {} } });
  assert.equal(publicError(new Error('secret path /tmp/foo')).error.message, 'Unexpected search-service error.');
});
