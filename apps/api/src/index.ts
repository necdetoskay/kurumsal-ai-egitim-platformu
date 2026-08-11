import { loadConfig } from '@kaep/config';
import { buildApp } from './app.js';

const config = loadConfig();
const app = buildApp(config);

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error({ err: error }, 'API startup failed');
  process.exitCode = 1;
}
