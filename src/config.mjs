import { SearchError } from './errors.mjs';

const intEnv = (name, fallback, min, max) => {
  const raw = process.env[name];
  const value = raw == null || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new SearchError('INVALID_CONFIG', `${name} must be an integer from ${min} to ${max}.`, 500);
  }
  return value;
};

const boolEnv = (name, fallback) => {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  if (/^(1|true|yes)$/i.test(raw)) return true;
  if (/^(0|false|no)$/i.test(raw)) return false;
  throw new SearchError('INVALID_CONFIG', `${name} must be true or false.`, 500);
};

export function loadConfig() {
  const consentMode = process.env.GOOGLE_CONSENT_MODE || 'manual';
  const defaultCountry = (process.env.GOOGLE_DEFAULT_COUNTRY || 'nl').toLowerCase();

  if (!['manual', 'accept', 'reject'].includes(consentMode)) {
    throw new SearchError('INVALID_CONFIG', 'GOOGLE_CONSENT_MODE must be manual, accept, or reject.', 500);
  }
  if (!/^[a-z]{2}$/.test(defaultCountry)) {
    throw new SearchError('INVALID_CONFIG', 'GOOGLE_DEFAULT_COUNTRY must be a two-letter country code.', 500);
  }

  return {
    headless: boolEnv('BROWSER_SEARCH_HEADLESS', true),
    consentMode,
    defaultCountry,
    cooldownMs: intEnv('GOOGLE_COOLDOWN_MS', 12000, 1000, 120000),
    blockBackoffMs: intEnv('GOOGLE_BLOCK_BACKOFF_MS', 900000, 60000, 86400000),
    maxResults: intEnv('GOOGLE_MAX_RESULTS', 10, 1, 20),
    maxQueue: intEnv('BROWSER_SEARCH_MAX_QUEUE', 8, 1, 100),
    navigationTimeoutMs: intEnv('GOOGLE_NAVIGATION_TIMEOUT_MS', 30000, 5000, 120000),
    resultTimeoutMs: intEnv('GOOGLE_RESULT_TIMEOUT_MS', 10000, 1000, 60000)
  };
}
