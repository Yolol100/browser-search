import { isPublicResultUrl } from './validation.mjs';

const TRACKING_KEYS = new Set(['gclid', 'dclid', 'fbclid', 'ved', 'sa', 'sourceid', 'ei', 'oq', 'gs_lcrp']);
const GOOGLE_HOST_RE = /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/i;

export function unwrapGoogleResultUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return rawUrl; }
  if (!GOOGLE_HOST_RE.test(url.hostname)) return rawUrl;
  if (url.pathname !== '/url') return rawUrl;
  const target = url.searchParams.get('q') || url.searchParams.get('url');
  return target || rawUrl;
}

export function normalizeResultUrl(rawUrl) {
  const unwrapped = unwrapGoogleResultUrl(rawUrl);
  if (!isPublicResultUrl(unwrapped)) return null;
  const url = new URL(unwrapped);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_KEYS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

export function dedupeResults(results, limit) {
  const seen = new Set();
  const output = [];
  for (const item of results || []) {
    const url = normalizeResultUrl(item.url);
    const title = String(item.title || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    output.push({
      title,
      url,
      snippet: String(item.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 600),
      domain: new URL(url).hostname,
      source: 'google-browser'
    });
    if (output.length >= limit) break;
  }
  return output;
}

export function looksBlocked(text = '', url = '') {
  const haystack = `${url}\n${text}`.toLowerCase();
  return /google\.[^/]+\/sorry|unusual traffic|automated quer(?:y|ies)|recaptcha|not a robot|ongebruikelijk verkeer|automatische zoekopdrachten/.test(haystack);
}
