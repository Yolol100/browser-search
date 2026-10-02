import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { validateSearchInput, isPublicResultUrl } from '../src/validation.mjs';
import { normalizeResultUrl, dedupeResults, looksBlocked, unwrapGoogleResultUrl } from '../src/results.mjs';
import { loadConfig } from '../src/config.mjs';
import { SerialCooldownGate } from '../src/gate.mjs';
import { buildGoogleSearchUrl, isExpectedGoogleHost, GoogleBrowserSearch } from '../src/google-browser.mjs';
import { createHttpServer, safeTokenEqual } from '../src/http-app.mjs';
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

test('unwraps Google redirect results but not ad redirectors', () => {
  assert.equal(
    unwrapGoogleResultUrl('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1&sa=U'),
    'https://example.com/a?x=1'
  );
  assert.equal(
    unwrapGoogleResultUrl('https://www.google.com/aclk?foo=bar'),
    'https://www.google.com/aclk?foo=bar'
  );
  assert.equal(normalizeResultUrl('https://www.google.com/aclk?foo=bar'), null);
  assert.equal(normalizeResultUrl('https://www.google.com/pagead/aclk?foo=bar'), null);
});

test('normalizes tracking params, parameter order and exact duplicates', () => {
  assert.equal(normalizeResultUrl('https://example.com/a?utm_source=x&z=3&b=2#part'), 'https://example.com/a?b=2&z=3');
  const results = dedupeResults([
    { title: 'A', url: 'https://example.com/a?utm_source=x&b=2', snippet: 'one' },
    { title: 'A duplicate', url: 'https://example.com/a?b=2', snippet: 'two' },
    { title: 'B', url: 'https://example.org/b', snippet: 'three' }
  ], 10);
  assert.equal(results.length, 2);
  assert.equal(results[0].source, 'google-browser');
});

test('detects Google automated-traffic block text in multiple languages', () => {
  assert.equal(looksBlocked('Our systems have detected unusual traffic from your computer network', 'https://www.google.com/sorry/'), true);
  assert.equal(looksBlocked('ongebruikelijk verkeer vanaf uw computernetwerk', 'https://www.google.nl/search?q=x'), true);
  assert.equal(looksBlocked('normal results', 'https://www.google.com/search?q=x'), false);
});

test('requires a sufficiently long token for non-loopback bind', () => {
  withEnv({ BROWSER_SEARCH_HOST: '0.0.0.0', BROWSER_SEARCH_TOKEN: '' }, () => assert.throws(() => loadConfig(), /TOKEN/));
  withEnv({ BROWSER_SEARCH_HOST: '0.0.0.0', BROWSER_SEARCH_TOKEN: 'short' }, () => assert.throws(() => loadConfig(), /24/));
  withEnv({ BROWSER_SEARCH_HOST: '0.0.0.0', BROWSER_SEARCH_TOKEN: '123456789012345678901234' }, () => assert.equal(loadConfig().host, '0.0.0.0'));
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

test('builds localized depersonalized Google search URL', () => {
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

test('constant-time token helper handles valid, invalid and missing bearer values', () => {
  assert.equal(safeTokenEqual('', undefined), true);
  assert.equal(safeTokenEqual('abcdefghijklmnopqrstuvwx', 'Bearer abcdefghijklmnopqrstuvwx'), true);
  assert.equal(safeTokenEqual('abcdefghijklmnopqrstuvwx', 'Bearer wrong'), false);
  assert.equal(safeTokenEqual('abcdefghijklmnopqrstuvwx', undefined), false);
});

test('HTTP layer enforces auth/content type and returns security headers', async () => {
  const calls = [];
  const fakeService = {
    readiness: async () => ({ ready: true, browser: 'chromium', executablePresent: true }),
    search: async input => { calls.push(input); return { provider: 'google-browser', query: input.query, count: 0, results: [], meta: {} }; }
  };
  const config = { token: 'abcdefghijklmnopqrstuvwx', requestTimeoutMs: 5000 };
  const server = createHttpServer(config, fakeService);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('cache-control'), 'no-store');
    assert.ok(health.headers.get('x-request-id'));

    const unauthorized = await fetch(`http://127.0.0.1:${port}/v1/search`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"query":"x"}' });
    assert.equal(unauthorized.status, 401);

    const wrongType = await fetch(`http://127.0.0.1:${port}/v1/search`, { method: 'POST', headers: { authorization: 'Bearer abcdefghijklmnopqrstuvwx', 'content-type': 'text/plain' }, body: '{}' });
    assert.equal(wrongType.status, 415);

    const ok = await fetch(`http://127.0.0.1:${port}/v1/search`, { method: 'POST', headers: { authorization: 'Bearer abcdefghijklmnopqrstuvwx', 'content-type': 'application/json' }, body: '{"query":"x"}' });
    assert.equal(ok.status, 200);
    assert.deepEqual(calls, [{ query: 'x' }]);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
