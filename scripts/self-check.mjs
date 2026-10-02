import fs from 'node:fs';

const required = [
  'README.md',
  'SECURITY.md',
  'package.json',
  'package-lock.json',
  '.env.example',
  'src/cli.mjs',
  'src/config.mjs',
  'src/errors.mjs',
  'src/gate.mjs',
  'src/google-browser.mjs',
  'src/mcp-server.mjs',
  'src/results.mjs',
  'src/service.mjs',
  'src/validation.mjs',
  'scripts/browser-smoke.mjs',
  'scripts/mcp-smoke.mjs',
  'test/core.test.mjs',
  'docs/chatgpt.md',
  '.github/workflows/ci.yml'
];

const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

const forbidden = [
  '.env',
  'storageState.json',
  'cookies.json',
  'Dockerfile',
  'docker-compose.yml',
  'openapi.yaml',
  'src/http-app.mjs',
  'src/server.mjs'
];
const presentForbidden = forbidden.filter(file => fs.existsSync(file));
if (presentForbidden.length) {
  console.error(`Unexpected files for the MCP-only architecture: ${presentForbidden.join(', ')}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const [name, version] of Object.entries(pkg.dependencies || {})) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Dependency ${name} is not exact-pinned: ${version}`);
    process.exit(1);
  }
}

console.log(`SELF_CHECK=green files=${required.length} dependencies=${Object.keys(pkg.dependencies || {}).length}`);
