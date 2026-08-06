import dotenv from 'dotenv';
import { buildApp } from './app.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`ARISE Backend Engine running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err, 'Failed to start Fastify backend server');
    process.exit(1);
  }
}

start();
