// src/app.js

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import helmet from 'helmet';

import { ENV } from './config/env.js';
import { redisClient } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import ApiError from './utils/ApiError.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');

if (ENV.isProduction) {
  app.set('trust proxy', 1);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (ENV.CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'automation_sess:',
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  session({
    name: ENV.COOKIE_NAME,
    store: redisStore,
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: ENV.isProduction,
    cookie: {
      secure: ENV.isProduction,
      httpOnly: true,
      sameSite: ENV.isProduction ? 'none' : 'lax',
      maxAge: ENV.COOKIE_MAX_AGE_MS,
      path: '/',
    },
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'internal-automation-builder-api',
    timestamp: new Date().toISOString(),
  });
});

import workflowRoutes from './routes/workflowRoutes.js';
import logRoutes from './routes/logRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/logs', logRoutes);
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;