import fs from 'node:fs';
import { SearchService } from '../src/service.mjs';
import { publicError } from '../src/errors.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;
const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';

if (!eventPath) {
  console.error('GITHUB_EVENT_PATH is required.');
  process.exit(2);
}
if (!token) {
  console.error('GITHUB_TOKEN is required.');
  process.exit(2);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const body = String(event.issue?.body || '').trim();
const repo = event.repository?.full_name;
const issueNumber = event.issue?.number;

if (!repo || !Number.isInteger(issueNumber)) {
  console.error('GitHub issue metadata is incomplete.');
  process.exit(2);
}

let input;
try {
  input = body.startsWith('{') ? JSON.parse(body) : { query: body };
} catch {
  input = { query: body };
}

let exitCode = 0;
let payload;
try {
  const service = new SearchService();
  payload = { ok: true, result: await service.search(input) };
} catch (error) {
  exitCode = 1;
  payload = { ok: false, ...publicError(error) };
}

const comment = [
  '<!-- browser-search-result:v1 -->',
  '# Browser search result',
  '',
  'Status: **' + (payload.ok ? 'success' : 'failed') + '**',
  '',
  '```json',
  JSON.stringify(payload, null, 2),
  '```',
  '',
  payload.ok
    ? 'Use the returned URLs as discovery results and verify destination sources before relying on their claims.'
    : 'The search failed closed. Do not bypass Google consent, CAPTCHA, automated-traffic or access controls.'
].join('\n');

async function github(method, path, data) {
  const response = await fetch(apiBase + path, {
    method,
    headers: {
      authorization: 'Bearer ' + token,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'browser-search',
      'x-github-api-version': '2022-11-28'
    },
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error('GitHub API ' + response.status + ': ' + detail);
  }
}

try {
  await github('POST', '/repos/' + repo + '/issues/' + issueNumber + '/comments', { body: comment });
  await github('PATCH', '/repos/' + repo + '/issues/' + issueNumber, { state: 'closed', state_reason: 'completed' });
} catch (error) {
  console.error('Failed to return browser-search result to GitHub:', error.message);
  process.exitCode = 2;
}

if (process.exitCode !== 2) {
  process.exitCode = exitCode;
}
