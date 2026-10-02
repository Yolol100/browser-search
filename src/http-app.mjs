import http from 'node:http';
import crypto from 'node:crypto';
import { SearchError, publicError } from './errors.mjs';

const MAX_BODY = 16 * 1024;

function json(res, status, payload, requestId) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...(requestId ? { 'x-request-id': requestId } : {})
  });
  res.end(body);
}

export function safeTokenEqual(expected, authorization) {
  if (!expected) return true;
  const prefix = 'Bearer ';
  if (!authorization?.startsWith(prefix)) return false;
  const actual = authorization.slice(prefix.length);
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function readJson(req) {
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new SearchError('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415);
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new SearchError('BODY_TOO_LARGE', 'Request body exceeds 16 KiB.', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new SearchError('INVALID_JSON', 'Request body must be valid JSON.', 400); }
}

export function createHttpServer(config, service) {
  const server = http.createServer({
    requestTimeout: config.requestTimeoutMs,
    headersTimeout: Math.min(10000, config.requestTimeoutMs),
    keepAliveTimeout: 5000
  }, async (req, res) => {
    const requestId = crypto.randomUUID();
    try {
      if (req.method === 'GET' && req.url === '/health') {
        return json(res, 200, { ok: true, service: 'browser-search', provider: 'google-browser' }, requestId);
      }
      if (req.method === 'GET' && req.url === '/ready') {
        const readiness = await service.readiness();
        return json(res, readiness.ready ? 200 : 503, readiness, requestId);
      }
      if (req.method === 'POST' && req.url === '/v1/search') {
        if (!safeTokenEqual(config.token, req.headers.authorization)) {
          return json(res, 401, { error: { code: 'UNAUTHORIZED', message: 'Invalid bearer token.' } }, requestId);
        }
        return json(res, 200, await service.search(await readJson(req)), requestId);
      }
      return json(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } }, requestId);
    } catch (error) {
      const status = error instanceof SearchError ? error.status : 500;
      return json(res, status, publicError(error), requestId);
    }
  });

  server.maxHeadersCount = 64;
  server.maxRequestsPerSocket = 100;
  return server;
}
