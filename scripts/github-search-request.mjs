import fs from 'node:fs';
import { SearchService } from '../src/service.mjs';
import { publicError } from '../src/errors.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('GITHUB_EVENT_PATH is required.');
  process.exit(2);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const body = String(event.issue?.body || '').trim();
const outputPath = process.env.BROWSER_SEARCH_RESULT_FILE || 'browser-search-result.md';

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

const lines = [
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
];

fs.writeFileSync(outputPath, lines.join('\n'));
process.exitCode = exitCode;
