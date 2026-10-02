import { loadConfig } from './config.mjs';
import { SearchService } from './service.mjs';
import { createHttpServer } from './http-app.mjs';

const config = loadConfig();
const service = new SearchService(config);
const server = createHttpServer(config, service);

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ event: 'ready', host: config.host, port: config.port }));
});

let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    server.close(() => process.exit(0));
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      process.exit(1);
    }, 5000);
    timer.unref();
  });
}
