import { buildApp } from './app.js';
import { env } from '../config/env.js';

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    console.log(`Server listening at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
