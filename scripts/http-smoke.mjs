import { spawn } from 'node:child_process';

const token = 'browser-search-smoke-token-123456';
const child = spawn(process.execPath, ['src/server.mjs'], {
  env: { ...process.env, BROWSER_SEARCH_HOST: '127.0.0.1', BROWSER_SEARCH_PORT: '18787', BROWSER_SEARCH_TOKEN: token },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk; });
const timeout = setTimeout(() => child.kill('SIGTERM'), 8000);

try {
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    try {
      const health = await fetch('http://127.0.0.1:18787/health');
      const browserReady = await fetch('http://127.0.0.1:18787/ready');
      if (health.ok && browserReady.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error(`HTTP server/readiness did not become green. ${stderr}`);
  console.log('HTTP_SMOKE=green');
} finally {
  clearTimeout(timeout);
  child.kill('SIGTERM');
  await new Promise(resolve => child.once('exit', resolve));
}
