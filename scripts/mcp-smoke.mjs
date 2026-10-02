import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['src/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'pipe'] });
let stderr = '';
const timeout = setTimeout(() => child.kill('SIGTERM'), 5000);
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

try {
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    if (stderr.includes('browser-search MCP server ready on stdio')) { ready = true; break; }
    if (child.exitCode != null) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!ready) throw new Error(`MCP stdio server did not start. ${stderr}`);
  console.log('MCP_SMOKE=green');
} finally {
  clearTimeout(timeout);
  child.kill('SIGTERM');
  await new Promise(resolve => child.once('exit', resolve));
}
