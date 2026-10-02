import net from 'node:net';
import { SearchError } from './errors.mjs';

const ALLOWED_INPUT_KEYS = new Set(['query', 'limit', 'language', 'country']);

export function validateSearchInput(input, configuredMax = 10, defaultCountry = 'nl') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SearchError('INVALID_REQUEST', 'Request body must be a JSON object.', 400);
  }
  const unknown = Object.keys(input).filter(key => !ALLOWED_INPUT_KEYS.has(key));
  if (unknown.length) {
    throw new SearchError('INVALID_REQUEST', `Unknown request field(s): ${unknown.join(', ')}.`, 400);
  }
  const query = String(input.query || '').trim();
  if (!query || query.length > 256) {
    throw new SearchError('INVALID_QUERY', 'query must contain 1 to 256 characters.', 400);
  }
  const limit = input.limit == null ? Math.min(10, configuredMax) : Number(input.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > configuredMax) {
    throw new SearchError('INVALID_LIMIT', `limit must be an integer from 1 to ${configuredMax}.`, 400);
  }
  const language = String(input.language || 'nl').trim().toLowerCase();
  if (!/^[a-z]{2}(?:-[a-z]{2})?$/.test(language)) {
    throw new SearchError('INVALID_LANGUAGE', 'language must look like nl or en-us.', 400);
  }
  const country = String(input.country || defaultCountry).trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(country)) {
    throw new SearchError('INVALID_COUNTRY', 'country must be a two-letter country code such as nl or be.', 400);
  }
  return { query, limit, language, country };
}

export function isPublicResultUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
  if (net.isIP(host)) return false;
  return true;
}
