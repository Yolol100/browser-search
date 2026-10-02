import fs from 'node:fs';

const required = [
  'README.md', 'SECURITY.md', 'package.json', '.env.example', 'Dockerfile', 'docker-compose.yml',
  'src/server.mjs', 'src/google-browser.mjs', 'src/validation.mjs', 'src/mcp-server.mjs',
  'scripts/browser-smoke.mjs', 'test/core.test.mjs', 'openapi.yaml',
  'schemas/search-request.schema.json', 'schemas/search-response.schema.json', '.github/workflows/ci.yml'
];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

const forbidden = ['.env', 'storageState.json', 'cookies.json'];
const presentForbidden = forbidden.filter(file => fs.existsSync(file));
if (presentForbidden.length) {
  console.error(`Forbidden local/runtime files present: ${presentForbidden.join(', ')}`);
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
