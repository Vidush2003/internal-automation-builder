// src/server.js

import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { startWorker } from './workflow-engine/worker.js';
import { initSocket } from './services/socketService.js';

const startServer = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);

    await connectRedis();
    startWorker();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(ENV.PORT, () => {
      console.log(
        `[server] running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`
      );
    });
  } catch (error) {
    console.error('[server] failed to start:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`[server] received ${signal}, shutting down...`);

  try {
    await mongoose.disconnect();
    await disconnectRedis();
    process.exit(0);
  } catch (error) {
    console.error('[server] graceful shutdown failed:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();